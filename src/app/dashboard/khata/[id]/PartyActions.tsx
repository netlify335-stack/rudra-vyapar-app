"use client";
import { useState } from "react";
import { EditPartyModal } from "../../parties/EditPartyModal";
import { useRouter } from "next/navigation";
import { getLocalDb } from "@/db/local";
import { parties, khataEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
export function PartyActions({ party }: { party: any }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${party.name}? All Khata entries and their balances will be permanently removed.`)) return;
    setDeleting(true);
    try {
      const db = await getLocalDb();
      await db.delete(khataEntries).where(eq(khataEntries.partyId, party.id));
      await db.delete(parties).where(eq(parties.id, party.id));

      router.push("/dashboard/parties");
      // Use window location reload after navigating to clear states if needed, but push is enough.
      setTimeout(() => window.location.reload(), 100);
    } catch (e) {
      console.error(e);
      alert("Error deleting party.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mt-2 flex gap-3">
        <button 
          onClick={() => setEditing(true)} 
          className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
        >
          Edit Party
        </button>
        <button 
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Party"}
        </button>
      </div>
      {editing && <EditPartyModal party={party} onClose={() => setEditing(false)} />}
    </>
  );
}
