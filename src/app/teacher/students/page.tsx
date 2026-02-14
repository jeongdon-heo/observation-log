"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStudentsByClass } from "@/lib/firestore";
import {
  createStudentAccount,
  updateStudentCredentials,
  deleteStudentAccount,
  generateDefaultEmail,
  generateDefaultPassword,
} from "@/lib/auth";
import { Spinner } from "@/components/ui";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { User } from "@/types";

interface CreatedAccount {
  name: string;
  email: string;
  password: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // 개별 추가
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 일괄 추가
  const [bulkNames, setBulkNames] = useState("");
  const [bulkCreating, setBulkCreating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");

  // 생성 결과
  const [createdAccounts, setCreatedAccounts] = useState<CreatedAccount[]>([]);
  const [error, setError] = useState("");

  // 선택 삭제
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // 수정 모달
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchStudents = useCallback(async () => {
    if (!user?.classId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getStudentsByClass(user.classId);
      setStudents(data);
    } catch (err) {
      console.error("학생 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 이름 입력 시 자동으로 이메일/비밀번호 생성
  const handleNameChange = (name: string) => {
    setNewName(name);
    if (!showAdvanced) {
      setNewEmail(generateDefaultEmail());
      setNewPassword(generateDefaultPassword());
    }
  };

  const handleToggleAdvanced = () => {
    const next = !showAdvanced;
    setShowAdvanced(next);
    if (next && !newEmail) {
      setNewEmail(generateDefaultEmail());
      setNewPassword(generateDefaultPassword());
    }
  };

  const handleCreateOne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.classId || !newName.trim()) return;

    setCreating(true);
    setError("");
    try {
      const email = showAdvanced && newEmail ? newEmail : undefined;
      const password = showAdvanced && newPassword ? newPassword : undefined;
      const result = await createStudentAccount(newName.trim(), user.classId, email, password);
      setCreatedAccounts([{ name: newName.trim(), ...result }]);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAdvanced(false);
      await fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("학생 계정 생성 실패:", err);
      if (message.includes("email-already-in-use")) {
        setError("이미 사용 중인 이메일입니다. 다른 이메일을 입력해주세요.");
      } else {
        setError(`학생 계정 생성 실패: ${message}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateBulk = async () => {
    if (!user?.classId) return;
    const names = bulkNames
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length === 0) return;

    setBulkCreating(true);
    setError("");
    const results: CreatedAccount[] = [];

    for (let i = 0; i < names.length; i++) {
      setBulkProgress(`${i + 1}/${names.length} 생성 중...`);
      try {
        const result = await createStudentAccount(names[i], user.classId);
        results.push({ name: names[i], ...result });
      } catch (err) {
        console.error(`${names[i]} 계정 생성 실패:`, err);
        results.push({ name: names[i], email: "생성 실패", password: "-" });
      }
    }

    setCreatedAccounts(results);
    setBulkNames("");
    setBulkProgress("");
    setBulkCreating(false);
    await fetchStudents();
  };

  const copyToClipboard = () => {
    const text = createdAccounts
      .map((a) => `${a.name}\t${a.email}\t${a.password}`)
      .join("\n");
    navigator.clipboard.writeText(`이름\t이메일\t비밀번호\n${text}`);
    alert("클립보드에 복사되었습니다!");
  };

  // 체크박스 토글
  const toggleSelect = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.uid)));
    }
  };

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`선택한 ${count}명의 학생을 삭제하시겠습니까?\n(작성한 일지와 댓글은 유지됩니다)`)) return;

    setDeleting(true);
    try {
      const uids = Array.from(selectedIds);
      for (const uid of uids) {
        const student = students.find((s) => s.uid === uid);
        if (!student) continue;
        await deleteStudentAccount(uid, student.email, student.managedPassword);
      }
      setSelectedIds(new Set());
      await fetchStudents();
    } catch (err) {
      console.error("학생 삭제 실패:", err);
      alert("일부 학생 삭제에 실패했습니다.");
      await fetchStudents();
    } finally {
      setDeleting(false);
    }
  };

  // 수정 모달 열기
  const openEdit = (student: User) => {
    setEditingStudent(student);
    setEditEmail(student.email);
    setEditPassword(student.managedPassword || "");
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingStudent) return;
    const currentPassword = editingStudent.managedPassword;
    if (!currentPassword) {
      setEditError("이 계정은 비밀번호 정보가 없어 수정할 수 없습니다. (직접 가입한 계정)");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const newEmail = editEmail !== editingStudent.email ? editEmail : undefined;
      const newPassword = editPassword !== currentPassword ? editPassword : undefined;

      if (!newEmail && !newPassword) {
        setEditingStudent(null);
        return;
      }

      await updateStudentCredentials(
        editingStudent.uid,
        editingStudent.email,
        currentPassword,
        newEmail,
        newPassword
      );
      setEditingStudent(null);
      await fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("계정 수정 실패:", err);
      if (message.includes("email-already-in-use")) {
        setEditError("이미 사용 중인 이메일입니다.");
      } else if (message.includes("requires-recent-login")) {
        setEditError("보안 정책으로 수정할 수 없습니다. 계정을 새로 만들어주세요.");
      } else if (message.includes("operation-not-allowed")) {
        setEditError("이메일 변경이 허용되지 않습니다. 비밀번호만 변경해주세요.");
      } else {
        setEditError(`수정 실패: ${message}`);
      }
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">학생 관리</h1>

      {/* 학생 추가 */}
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-bold">학생 추가</h2>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
        )}

        {/* 개별 추가 */}
        <form onSubmit={handleCreateOne} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="학생 이름"
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 whitespace-nowrap"
            >
              {creating ? "생성 중..." : "추가"}
            </button>
          </div>

          {/* 이메일/비밀번호 직접 설정 */}
          <button
            type="button"
            onClick={handleToggleAdvanced}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {showAdvanced ? "▲ 이메일/비밀번호 설정 닫기" : "▼ 이메일/비밀번호 직접 설정"}
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="이메일"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">비밀번호</label>
                <input
                  type="text"
                  placeholder="비밀번호 (6자 이상)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>
            </div>
          )}
        </form>

      </div>

      {/* 생성 결과 */}
      {createdAccounts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-green-800">
              생성된 계정 정보 ({createdAccounts.length}명)
            </h3>
            <button
              onClick={copyToClipboard}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
            >
              전체 복사
            </button>
          </div>
          <p className="text-xs text-green-700">
            아래 정보를 학생들에게 전달해주세요.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-green-700">
                  <th className="py-1.5 pr-4">이름</th>
                  <th className="py-1.5 pr-4">이메일 (아이디)</th>
                  <th className="py-1.5">비밀번호</th>
                </tr>
              </thead>
              <tbody>
                {createdAccounts.map((a, i) => (
                  <tr key={i} className="border-t border-green-200">
                    <td className="py-1.5 pr-4 font-medium">{a.name}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs">{a.email}</td>
                    <td className="py-1.5 font-mono text-xs">{a.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 학생 명단 */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            학생 명단 <span className="text-sm font-normal text-gray-400">({students.length}명)</span>
          </h2>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : `선택 삭제 (${selectedIds.size}명)`}
            </button>
          )}
        </div>

        {students.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            아직 등록된 학생이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.size === students.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">이름</th>
                  <th className="py-2 pr-4">이메일</th>
                  <th className="py-2 pr-4">비밀번호</th>
                  <th className="py-2 pr-4">가입일</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.uid} className={`border-t border-gray-100 hover:bg-gray-50 ${selectedIds.has(s.uid) ? "bg-red-50" : ""}`}>
                    <td className="py-2.5 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.uid)}
                        onChange={() => toggleSelect(s.uid)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 pr-4 font-medium">{s.name}</td>
                    <td className="py-2.5 pr-4 text-gray-500 font-mono text-xs">{s.email}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-gray-400">
                      {s.managedPassword || "-"}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">
                      {format(s.createdAt, "yyyy.M.d", { locale: ko })}
                    </td>
                    <td className="py-2.5">
                      {s.managedPassword && (
                        <button
                          onClick={() => openEdit(s)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">
              {editingStudent.name} 계정 수정
            </h3>

            {editError && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{editError}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
              {editEmail !== editingStudent.email && (
                <p className="text-xs text-orange-500 mt-1">이메일 변경 시 계정이 재생성됩니다</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition text-sm"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 text-sm"
              >
                {editSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
