import { prisma } from '../../db/prisma.js';
import { TX_OPTS } from '../../config/transaction.js';
import * as service from '../../services/indikatorService.js';
import { FORMULAS, FIELD_CATALOG, defaultFields } from '../../services/indikatorConfig.js';
const actor = (req) => ({ userId: req.user.userId, ip: req.ip });
export function contract(_req, res) { res.json({ formulas: FORMULAS, fields: FIELD_CATALOG, defaults: Object.fromEntries(FORMULAS.map((f) => [f, defaultFields(f)])) }); }
export async function list(_req, res) { res.json({ data: await service.listMaster() }); }
export async function detail(req, res) { res.json({ data: (await service.listMaster()).find((r) => r.id === service.parseId(req.params.id)) ?? null }); }
export async function create(req, res) { res.status(201).json({ data: await service.createMaster(req.body, actor(req)) }); }
export async function update(req, res) { res.json({ data: await service.updateMaster(req.params.id, req.body, actor(req)) }); }
export async function remove(req, res) { res.json(await service.deleteMaster(req.params.id, actor(req))); }
export async function periodList(req, res) { res.json({ data: await service.listPeriod(req.params.periodeId) }); }
export async function periodAdd(req, res) { res.status(201).json({ data: await service.addPeriod(req.params.periodeId, req.body, actor(req)) }); }
export async function periodUpdate(req, res) { res.json({ data: await prisma.$transaction((tx) => service.updatePeriod(tx, req.params.periodeId, req.params.indikatorId, req.body, actor(req)), TX_OPTS) }); }
export async function preview(req, res) { res.json(await service.previewPeriod(req.params.periodeId, req.params.indikatorId, req.body)); }
export async function copy(req, res) { res.json(await service.copyWeights(req.params.periodeId, req.body, actor(req))); }
