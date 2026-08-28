export interface Driver {
  code: string;
  name: string;
  turno?: "MANHA" | "TARDE" | "NOITE";
}

export const drivers: Driver[] = [
  { code: "1012", name: "José Carlos Silva", turno: "MANHA" },
  { code: "1045", name: "Marcos Antônio Pereira", turno: "MANHA" },
  { code: "1089", name: "Valdir Santos Oliveira", turno: "MANHA" },
  { code: "1120", name: "Edson Ferreira Lima", turno: "MANHA" },
  { code: "1154", name: "Cláudio Roberto Souza", turno: "MANHA" },
  { code: "1187", name: "Luiz Fernando Barbosa", turno: "MANHA" },
  { code: "1203", name: "Antônio Carlos Rocha", turno: "MANHA" },
  { code: "1245", name: "Paulo Henrique Ramos", turno: "MANHA" },
  { code: "1290", name: "Reginaldo de Almeida", turno: "MANHA" },
  { code: "1312", name: "Sérgio Murilo Costa", turno: "MANHA" },
  { code: "1350", name: "Fabiano Gonçalves Dias", turno: "MANHA" },
  { code: "1388", name: "Rogério Batista Matos", turno: "MANHA" },
  { code: "1402", name: "Wellington Alves Ribeiro", turno: "MANHA" },
  { code: "1425", name: "Gilberto Mendes Prado", turno: "MANHA" },
  { code: "1460", name: "Adriano Cesar Pinto", turno: "MANHA" },
  { code: "1490", name: "Marcelo dos Santos", turno: "MANHA" },
  { code: "1510", name: "Juliano de Souza Cruz", turno: "MANHA" },
  { code: "1535", name: "Anderson Luiz Vieira", turno: "MANHA" },
  { code: "1580", name: "Ederaldo Cardoso", turno: "MANHA" },
  { code: "1602", name: "Wagner Roberto Neves", turno: "MANHA" },
  { code: "1630", name: "Daniel Francisco Paz", turno: "MANHA" },
  { code: "1675", name: "Alexandre Carvalho", turno: "MANHA" },
  { code: "1700", name: "Vagner Silveira Gomes", turno: "MANHA" },
  { code: "01", name: "Motorista 01 (Reserva Manhã)", turno: "MANHA" },
  { code: "02", name: "Motorista 02 (Reserva Tarde)", turno: "TARDE" },
  { code: "03", name: "Motorista 03 (Reserva Band)", turno: "MANHA" },
  { code: "04", name: "Motorista 04 (Reserva J.C)", turno: "MANHA" },
  { code: "05", name: "Motorista 05 (Reserva G.O)", turno: "MANHA" },
  { code: "06", name: "Motorista 06 (Reserva N.B)", turno: "MANHA" }
];

