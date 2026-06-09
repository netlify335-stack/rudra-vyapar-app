"use client";
import { useState } from "react";
import { ManageCategoriesModal } from "./ManageCategoriesModal";
import { ManageExtrasModal } from "./ManageExtrasModal";
import { Settings, Tags } from "lucide-react";

export function InventorySettingsButtons({ storeId }: { storeId: string }) {
  const [openCat, setOpenCat] = useState(false);
  const [openExt, setOpenExt] = useState(false);

  return (
    <>
      <div className="flex gap-3">
        <button 
          onClick={() => setOpenCat(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          <Tags className="h-4 w-4" /> Manage Categories
        </button>
        <button 
          onClick={() => setOpenExt(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          <Settings className="h-4 w-4" /> Manage Extras
        </button>
      </div>

      <ManageCategoriesModal open={openCat} storeId={storeId} onClose={() => setOpenCat(false)} />
      <ManageExtrasModal open={openExt} storeId={storeId} onClose={() => setOpenExt(false)} />
    </>
  );
}
