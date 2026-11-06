-- PARA REVISAO. NAO EXECUTADO AUTOMATICAMENTE.
-- Executar somente no banco correto do Sistema Garagem.
-- Login: manutencao_vcm@teste.com
-- Senha: a mesma do usuario manutencao_vcg@teste.com.
-- Copia somente o hash bcrypt; nao retorna senha/hash nos resultados.
-- Requer API/web atualizados com permissao de manutencao da propria garagem.
-- CI VCM continua dependendo da habilitacao e origem inicial existentes.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;

  IF EXISTS (SELECT 1 FROM dbo.users WITH (UPDLOCK,HOLDLOCK) WHERE email=N'manutencao_vcm@teste.com')
    THROW 50001, 'Usuario VCM ja existe. Nenhum cadastro sera sobrescrito.', 1;

  DECLARE @GrupoId INT;
  SELECT @GrupoId=id FROM dbo.groups WHERE name=N'Manutenção';
  IF @GrupoId IS NULL
    THROW 50002, 'Grupo Manutencao nao encontrado. Confira o cadastro de grupos.', 1;

  INSERT INTO dbo.users ([name], email, [password], [role], garagem, created_at, updated_at)
  SELECT N'Manutenção VCM', N'manutencao_vcm@teste.com', [password], N'manutencao', N'VCM', SYSUTCDATETIME(), SYSUTCDATETIME()
  FROM dbo.users
  WHERE email=N'manutencao_vcg@teste.com' AND [role]=N'manutencao' AND garagem=N'VCG';

  IF @@ROWCOUNT <> 1
    THROW 50003, 'Usuario de manutencao VCG nao encontrado com perfil/garagem esperados.', 1;

  DECLARE @UsuarioId INT=CONVERT(INT,SCOPE_IDENTITY());
  -- Relacao implicita Prisma Group.users/User.groups: A=Group.id, B=User.id.
  INSERT INTO dbo._GroupToUser ([A], [B]) VALUES (@GrupoId, @UsuarioId);

  COMMIT TRANSACTION;
  SELECT id, [name], email, [role], garagem FROM dbo.users WHERE id=@UsuarioId;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
