import * as madrasahService from '../../services/madrasahService.js';
export async function list(req,res){ const r = await madrasahService.listMadrasah(req.query); res.json(r); }
export async function create(req,res){ const r = await madrasahService.createMadrasah(req.body, { userId: req.user.userId, ip: req.ip }); res.status(201).json({ data: r }); }
export async function update(req,res){ const r = await madrasahService.updateMadrasah(req.params.id, req.body, { userId: req.user.userId, ip: req.ip }); res.json({ data: r }); }
export async function softRemove(req,res){ const r = await madrasahService.softDeleteMadrasah(req.params.id, { userId: req.user.userId, ip: req.ip, alasan: req.body?.alasan }); res.json({ data: r }); }
export async function activate(req,res){ const r = await madrasahService.activateMadrasah(req.params.id, { userId: req.user.userId, ip: req.ip }); res.json({ data: r }); }
export async function remove(req,res){ const r = await madrasahService.hardDeleteMadrasah(req.params.id, { userId: req.user.userId, ip: req.ip }); res.json({ data: r }); }
export default { list, create, update, softRemove, activate, remove };
