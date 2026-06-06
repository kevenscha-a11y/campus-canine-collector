import { Navigate, useSearchParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminDogPanel } from "@/components/AdminDogPanel";
import { Card } from "@/components/ui/card";

export default function AdminPage() {
  const { isAdmin, loading } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const edit = searchParams.get("edit");
  const create = searchParams.get("create");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-900">
            Painel de Administração
          </h1>
          <p className="mt-2 text-amber-700">
            Gerencie o catálogo de cães e QR codes
          </p>
        </div>

        <Card className="bg-white">
          <AdminDogPanel
            editDogId={edit}
            createMode={create != null}
            onClose={() => {
              const s = new URLSearchParams(searchParams);
              s.delete("edit");
              s.delete("create");
              setSearchParams(s);
            }}
          />
        </Card>
      </div>
    </div>
  );
}
