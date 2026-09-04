import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCog, ShieldAlert, FolderKey, Loader2 } from "lucide-react";
import { type Role } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  garagem?: string;
  createdAt: string;
  groups?: { id: number; name: string }[];
}

interface Group {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { path: "/home", label: "Início (Dashboard)" },
  { path: "/catracas", label: "Conferência Catracas" },
  { path: "/abastecimento", label: "Leitura de Tanques" },
  { path: "/abastecimento-carro", label: "Abastecimento por Carro" },
  { path: "/soltura", label: "Soltura" },
  { path: "/manutencao", label: "Manutenção" },
  { path: "/soltura-adm", label: "Soltura ADM" },
  { path: "/escala-carros", label: "Escala Carros" },
  { path: "/controle-operacional", label: "Controle Operacional" },
  { path: "/admin/usuarios", label: "Usuários (Administração)" },
];

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<"usuarios" | "grupos">("usuarios");
  const [initialLoading, setInitialLoading] = useState(true);

  // Estados do Formulário de Usuário
  const [userOpen, setUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<string>("COLABORADOR");
  const [userGroupIds, setUserGroupIds] = useState<number[]>([]);
  const [userGaragem, setUserGaragem] = useState<string>("");
  const [userLoading, setUserLoading] = useState(false);

  // Estados do Formulário de Grupo
  const [groupOpen, setGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupPermissions, setGroupPermissions] = useState<string[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  const loadData = async () => {
    try {
      const [uData, gData] = await Promise.all([
        api.listUsers(),
        api.listGroups(),
      ]);
      setUsers(uData as User[]);
      setGroups(gData as Group[]);
    } catch (err: any) {
      toast.error("Erro ao carregar dados: " + err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helpers Usuário
  const resetUserForm = () => {
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("COLABORADOR");
    setUserGroupIds([]);
    setUserGaragem("");
    setEditingUser(null);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword("");
    setUserRole(user.role);
    setUserGroupIds(user.groups ? user.groups.map((g) => g.id) : []);
    setUserGaragem(user.garagem || "");
    setUserOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    try {
      const payload: any = { 
        name: userName, 
        email: userEmail, 
        role: userRole, 
        groupIds: userGroupIds,
        garagem: userGaragem === "none" || !userGaragem ? null : userGaragem
      };
      if (userPassword) payload.password = userPassword;

      if (editingUser) {
        await api.updateUser(editingUser.id, payload);
        toast.success("Usuário atualizado!");
      } else {
        await api.createUser({ ...payload, password: userPassword });
        toast.success("Usuário criado!");
      }
      setUserOpen(false);
      resetUserForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar usuário");
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserDelete = async (user: User) => {
    if (!confirm(`Excluir o usuário "${user.name}"?`)) return;
    try {
      await api.deleteUser(user.id);
      toast.success("Usuário excluído!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir usuário");
    }
  };

  // Helpers Grupo
  const resetGroupForm = () => {
    setGroupName("");
    setGroupDescription("");
    setGroupPermissions([]);
    setEditingGroup(null);
  };

  const openEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setGroupPermissions(group.permissions);
    setGroupOpen(true);
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupLoading(true);
    try {
      const payload = {
        name: groupName,
        description: groupDescription,
        permissions: groupPermissions,
      };

      if (editingGroup) {
        await api.updateGroup(editingGroup.id, payload);
        toast.success("Grupo atualizado!");
      } else {
        await api.createGroup(payload);
        toast.success("Grupo criado!");
      }
      setGroupOpen(false);
      resetGroupForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar grupo");
    } finally {
      setGroupLoading(false);
    }
  };

  const handleGroupDelete = async (group: Group) => {
    if (!confirm(`Deseja realmente excluir o grupo "${group.name}"?`)) return;
    try {
      await api.deleteGroup(group.id);
      toast.success("Grupo excluído com sucesso!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir grupo");
    }
  };

  const handlePermissionToggle = (path: string) => {
    if (groupPermissions.includes(path)) {
      setGroupPermissions(groupPermissions.filter((p) => p !== path));
    } else {
      setGroupPermissions([...groupPermissions, path]);
    }
  };

  const getPermissionLabel = (path: string) => {
    return AVAILABLE_PERMISSIONS.find((p) => p.path === path)?.label || path;
  };

  if (initialLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Menu de Abas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold pb-3">Administração</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Gerencie usuários, múltiplos grupos e permissões dinâmicas de acesso.</p>
        </div>

        {/* Seletor de Abas */}
        <div className="flex bg-muted/40 p-1 rounded-lg border max-w-fit self-start">
          <button
            onClick={() => setActiveTab("usuarios")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              activeTab === "usuarios" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCog className="h-3.5 w-3.5" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab("grupos")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              activeTab === "grupos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Grupos & Permissões
          </button>
        </div>
      </div>

      {/* ABA DE USUÁRIOS */}
      {activeTab === "usuarios" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-muted/10 p-3 rounded-lg border">
            <span className="text-xs font-semibold text-muted-foreground">Total de Usuários: {users.length}</span>
            <Dialog open={userOpen} onOpenChange={(v) => { setUserOpen(v); if (!v) resetUserForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUserSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="userName">Nome</Label>
                    <Input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nome completo" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="userEmail">Email</Label>
                    <Input id="userEmail" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="email@exemplo.com" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="userPassword">Senha {editingUser && "(deixe em branco para manter)"}</Label>
                    <Input id="userPassword" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder={editingUser ? "Nova senha" : "Senha de acesso"} required={!editingUser} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="userRole">Papel Herdado (Fallback)</Label>
                    <Select value={userRole} onValueChange={setUserRole}>
                      <SelectTrigger id="userRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                        <SelectItem value="tanque">Tanque</SelectItem>
                        <SelectItem value="abastecimento">Abastecimento</SelectItem>
                        <SelectItem value="soltura">Soltura</SelectItem>
                        <SelectItem value="operacional">Controle Operacional</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="userGaragem">Garagem</Label>
                    <Select value={userGaragem || "none"} onValueChange={setUserGaragem}>
                      <SelectTrigger id="userGaragem">
                        <SelectValue placeholder="Selecione a garagem (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="VCG">Garagem VCG</SelectItem>
                        <SelectItem value="VCM">Garagem VCM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seleção de Grupos */}
                  <div className="space-y-2 pt-1">
                    <Label>Vincular a Grupos de Permissões</Label>
                    {groups.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 border p-3 rounded-md bg-muted/20 max-h-36 overflow-y-auto">
                        {groups.map((g) => (
                          <label key={g.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={userGroupIds.includes(g.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserGroupIds([...userGroupIds, g.id]);
                                } else {
                                  setUserGroupIds(userGroupIds.filter((id) => id !== g.id));
                                }
                              }}
                              className="rounded border-input text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="font-semibold text-foreground truncate">{g.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground border p-3 rounded bg-muted/10">
                        Nenhum grupo cadastrado. Vá até a aba "Grupos & Permissões" para criar um.
                      </div>
                    )}
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={userLoading} className="w-full sm:w-auto">
                      {userLoading ? "Salvando..." : editingUser ? "Atualizar Usuário" : "Criar Usuário"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y">
                {users.map((user) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          {user.garagem && (
                            <span className="inline-flex items-center bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded px-1.5 py-0.5 text-[9px] font-bold">
                              Garagem: {user.garagem}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        
                        {/* Grupos associados */}
                        {user.groups && user.groups.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {user.groups.map((g) => (
                              <span key={g.id} className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded px-1.5 py-0.5 text-[9px] font-bold">
                                {g.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                          : user.role === "tanque"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                            : user.role === "soltura"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                              : user.role === "operacional"
                                ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400"
                                : user.role === "abastecimento"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}>
                        {user.role === "ADMIN"
                          ? "Admin"
                          : user.role === "tanque"
                            ? "Tanque"
                            : user.role === "soltura"
                              ? "Soltura"
                              : user.role === "operacional"
                                ? "Operacional"
                                : user.role === "abastecimento"
                                  ? "Abastecimento"
                                  : "Colaborador"}
                      </span>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditUser(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUserDelete(user)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA DE GRUPOS E PERMISSÕES */}
      {activeTab === "grupos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-muted/10 p-3 rounded-lg border">
            <span className="text-xs font-semibold text-muted-foreground">Total de Grupos: {groups.length}</span>
            <Dialog open={groupOpen} onOpenChange={(v) => { setGroupOpen(v); if (!v) resetGroupForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingGroup ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGroupSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="groupName">Nome do Grupo</Label>
                    <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: Equipe Operacional, Portaria" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="groupDescription">Descrição</Label>
                    <Input id="groupDescription" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Resumo da finalidade do grupo (opcional)" />
                  </div>

                  {/* Checkboxes de Permissões */}
                  <div className="space-y-2 pt-1">
                    <Label>Acesso aos Menus do Sistema</Label>
                    <div className="space-y-2 border p-3 rounded-md bg-muted/20">
                      {AVAILABLE_PERMISSIONS.map((perm) => (
                        <label key={perm.path} className="flex items-center gap-2.5 text-xs cursor-pointer select-none py-1 border-b last:border-0 border-muted/50">
                          <input
                            type="checkbox"
                            checked={groupPermissions.includes(perm.path)}
                            onChange={() => handlePermissionToggle(perm.path)}
                            className="rounded border-input text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{perm.label}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{perm.path}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" disabled={groupLoading} className="w-full sm:w-auto">
                      {groupLoading ? "Salvando..." : editingGroup ? "Atualizar Grupo" : "Criar Grupo"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Card key={group.id} className="flex flex-col justify-between border">
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                      <FolderKey className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                      {group.name}
                    </CardTitle>
                    {group.description && (
                      <CardDescription className="text-xs">{group.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditGroup(group)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleGroupDelete(group)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 border-t bg-muted/10 p-4">
                  <span className="text-[10px] font-semibold text-muted-foreground block mb-2 uppercase">Menus Permitidos:</span>
                  {group.permissions && group.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {group.permissions.map((permPath) => (
                        <span key={permPath} className="inline-flex bg-background border rounded px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          {getPermissionLabel(permPath)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Nenhum acesso configurado.</span>
                  )}
                </CardContent>
              </Card>
            ))}

            {groups.length === 0 && (
              <div className="col-span-full border-2 border-dashed rounded-lg p-10 text-center text-muted-foreground">
                <ShieldAlert className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
                <p className="font-semibold text-sm">Nenhum Grupo de Permissão Cadastrado</p>
                <p className="text-xs mt-1">Crie grupos acima e selecione quais páginas os colaboradores associados poderão visualizar.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
