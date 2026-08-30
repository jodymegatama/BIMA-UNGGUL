import * as accountService from '../../services/accountService.js';
export async function list(req,res){ const r= await accountService.listAkun(req.query); res.json(r); }
export async function create(req,res){ const r= await accountService.createAkun(req.body, { userId: req.user.userId, ip: req.ip }); res.status(201).json({ data: r }); }
export async function update(req,res){ const r= await accountService.updateAkun(req.params.id, req.body, { userId: req.user.userId, ip: req.ip }); res.json({ data: r }); }
export async function remove(req,res){ const r = await accountService.deleteAkun(req.params.id, { userId: req.user.userId, ip: req.ip }); res.json({ data: r }); }
export async function madrasahList(req,res){ const r = await accountService.listMadrasahDropdown(); res.json({ data: r }); }
export default { list, create, update, remove, madrasahList };
