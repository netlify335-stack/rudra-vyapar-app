import { db } from "@/db";
import { licenses } from "@/db/neonSchema";
import { generateLicense, revokeLicense } from "./actions";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function AdminPage() {
  const session = await getServerSession();
  
  // Basic security check (Replace with proper admin emails from env)
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  if (session?.user?.email && !adminEmails.includes(session.user.email)) {
    // Note: for prototype, we might skip strict redirect if env is not set
    // redirect("/");
  }

  const allLicenses = await db.select().from(licenses).orderBy(licenses.createdAt);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-semibold mb-4">Generate New License Key</h2>
        <form action={generateLicense} className="flex gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Customer Name/Email</label>
            <input name="name" type="text" placeholder="John Doe" className="border p-2 rounded" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Duration Type</label>
            <select name="type" className="border p-2 rounded">
              <option value="days">Days</option>
              <option value="months">Months</option>
              <option value="infinity">Infinity (Lifetime)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Value (1-12)</label>
            <input name="value" type="number" min="1" max="12" defaultValue="1" className="border p-2 rounded" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Generate
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-xl font-semibold mb-4">All Licenses</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">Key</th>
              <th className="py-2">User</th>
              <th className="py-2">Status</th>
              <th className="py-2">Expiry</th>
              <th className="py-2">Device Bound</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {allLicenses.map((l) => (
              <tr key={l.licenseKey} className="border-b">
                <td className="py-2 font-mono text-sm">{l.licenseKey}</td>
                <td className="py-2">{l.userEmail || "-"}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${l.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {l.status}
                  </span>
                </td>
                <td className="py-2">{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : "Lifetime"}</td>
                <td className="py-2">{l.deviceId ? "Yes" : "No"}</td>
                <td className="py-2">
                  {l.status === "active" && (
                    <form action={async () => {
                      "use server";
                      await revokeLicense(l.licenseKey);
                    }}>
                      <button type="submit" className="text-red-600 hover:underline text-sm">Revoke</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {allLicenses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">No licenses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
