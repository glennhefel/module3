import express from 'express';
import { authenticateToken } from '../middleware/authi.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { scrapeTopAnime } from '../scrape.js';
import Media from '../models/media.model.js';
import scrapeEmitter from '../utils/scrapeEvents.js';
import jwt from 'jsonwebtoken';

let lastRunId = '';

const router = express.Router();

// Trigger scraper (admins only)
router.post('/scrape', authenticateToken, isAdmin, async (req, res) => {
  try {
    const limit = Number(req.body.limit) || 100;
    const runId = String(Date.now());
    lastRunId = runId;
    // Run scraper but don't block the request for too long — run and report task started.
    scrapeTopAnime(limit, runId)
      .then((summary) => {
        console.log(`Scrape finished (limit=${limit}, runId=${runId})`, summary);
        try { scrapeEmitter.emit('log', { runId, type: 'done', summary }); } catch (e) {}
      })
      .catch(err => console.error('Scrape failed:', err));

    return res.json({ message: `Scrape started (limit=${limit})`, runId });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// SSE endpoint for scrape logs (admins). Accepts token via query param for EventSource.
router.get('/scrape/events', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(401).end();
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).end();
    }
    if (!decoded?.isAdmin) return res.status(403).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    const onLog = (payload) => {
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        // ignore write errors
      }
    };

    scrapeEmitter.on('log', onLog);

    req.on('close', () => {
      scrapeEmitter.removeListener('log', onLog);
    });
  } catch (err) {
    return res.status(500).end();
  }
});

// Revert a previous scrape by runId (admins only)
router.post('/revert', authenticateToken, isAdmin, async (req, res) => {
  try {
    const runId = String(req.body.runId || lastRunId || '').trim();
    if (!runId) return res.status(400).json({ error: 'runId required' });

    const result = await Media.deleteMany({ scrapeRunId: runId });
    return res.json({ message: `Removed ${result.deletedCount || 0} scraped items`, runId });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
