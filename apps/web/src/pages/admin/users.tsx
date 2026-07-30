import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "COLABORADOR" | "COLABORADOR_ABASTECIMENTO" | "COLABORADOR_SOLTURA";
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("COLABORADOR");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await api.listUsers();
    setUsers(data as User[]);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("COLABORADOR");
    setEditing(null);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const data: any = { name, email, role };
        if (password) data.password = password;
        await api.updateUser(editing.id, data);
        toast.success("Usuário atualizado!");
      } else {
        await api.createUser({ name, email, password, role });
        toast.success("Usuário criado!");
      }
      setOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Excluir ${user.name}?`)) return;
    try {
      await api.deleteUser(user.id);
      toast.success("Usuário excluído!");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" required />
              </div>
              <div className="space-y-2">
                <Label>Senha {editing && "(deixe em branco para manter)"}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? "Nova senha" : "Senha"} required={!editing} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                    <SelectItem value="COLABORADOR_ABASTECIMENTO">Colaborador (Abastecimento)</SelectItem>
                    <SelectItem value="COLABORADOR_SOLTURA">Colaborador (Soltura)</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : editing ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <span className={`ml-4 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-700"
                      : user.role === "COLABORADOR_ABASTECIMENTO"
                        ? "bg-green-100 text-green-700"
                        : user.role === "COLABORADOR_SOLTURA"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.role === "ADMIN"
                      ? "Admin"
                      : user.role === "COLABORADOR_ABASTECIMENTO"
                        ? "Abastecimento"
                        : user.role === "COLABORADOR_SOLTURA"
                          ? "Soltura"
                          : "Colaborador"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
