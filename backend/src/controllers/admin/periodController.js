import * as periodService from '../../services/periodService.js';
export async function list(req,res){ const data= await periodService.listPeriode(req.query); res.json({ data }); }
export async function create(req,res){ const data= await periodService.createPeriode(req.body, { userId: req.user.userId, ip: req.ip }); res.status(201).json({ data }); }
export async function update(req,res){ const data= await periodService.updatePeriode(req.params.id, req.body, { userId: req.user.userId, ip: req.ip }); res.json({ data }); }
export async function finalize(req,res){ const data= await periodService.finalizePeriode(req.params.id, { userId: req.user.userId, ip: req.ip }); res.json({ data }); }
export async function reopen(req,res){ const data= await periodService.reopenPeriode(req.params.id, { alasan: req.body?.alasan, userId: req.user.userId, ip: req.ip }); res.json({ data }); }
export async function remove(req,res){ const data = await periodService.deletePeriode(req.params.id, { userId: req.user.userId, ip: req.ip }); res.json({ data }); }
export default { list, create, update, remove, finalize, reopen };
