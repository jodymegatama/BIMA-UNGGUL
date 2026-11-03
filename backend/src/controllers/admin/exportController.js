import * as exportService from '../../services/exportService.js';
export async function pdf(req,res){
  const buf = await exportService.buildPdfBuffer({ periodeId: req.query.periodeId, kelompok: req.query.kelompok, jenjang: req.query.jenjang });
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=leaderboard-${req.query.periodeId||'all'}.pdf`);
  res.send(buf);
}
export async function excel(req,res){
  const buf = await exportService.buildExcelBuffer({ periodeId: req.query.periodeId, kelompok: req.query.kelompok, jenjang: req.query.jenjang });
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=leaderboard-${req.query.periodeId||'all'}.xlsx`);
  res.send(buf);
}
export default { pdf, excel };
