"use client";
import toast from "react-hot-toast";
import { removeBookmark } from "@/lib/bookmark";
const DeleteBookmark = ({ bookId }: { bookId: string }) => {
  const handleDeleteBookmark = () => {
    removeBookmark(bookId);
    toast.success("Bookmark dihapus");
  };
  return <button onClick={handleDeleteBookmark} className="rounded-full border border-violet-300/15 bg-violet-300/[0.08] px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/[0.16]">Hapus</button>;
};
export default DeleteBookmark;