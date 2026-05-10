import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get active polls (filtered by user's problem type)
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = db.prepare('SELECT problem FROM users WHERE id = ?').get(req.user!.id) as any;
  const problem = user?.problem;

  const polls = db.prepare(`
    SELECT id, question, options, problem_type, created_at
    FROM polls
    WHERE is_active = 1 AND (problem_type IS NULL OR problem_type = ? OR problem_type = 'all')
    ORDER BY created_at DESC
  `).all(problem || '') as any[];

  // Get user's votes
  const votes = db.prepare('SELECT poll_id, option_index FROM poll_votes WHERE user_id = ?').all(req.user!.id) as any[];
  const votedMap = Object.fromEntries(votes.map(v => [v.poll_id, v.option_index]));

  // Get vote counts per poll
  const result = polls.map(p => {
    const options = JSON.parse(p.options);
    const voteCounts = db.prepare(`
      SELECT option_index, COUNT(*) as count FROM poll_votes WHERE poll_id = ? GROUP BY option_index
    `).all(p.id) as any[];
    const countMap = Object.fromEntries(voteCounts.map(v => [v.option_index, v.count]));
    const totalVotes = voteCounts.reduce((s, v) => s + v.count, 0);

    return {
      id: p.id,
      question: p.question,
      options: options.map((opt: string, i: number) => ({
        index: i,
        text: opt,
        votes: countMap[i] || 0,
        percent: totalVotes > 0 ? Math.round(((countMap[i] || 0) / totalVotes) * 100) : 0,
      })),
      totalVotes,
      userVote: votedMap[p.id] ?? null,
      problemType: p.problem_type,
      createdAt: p.created_at,
    };
  });

  res.json({ success: true, data: result });
}));

// Vote on poll
router.post('/:id/vote', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { optionIndex } = z.object({ optionIndex: z.number() }).parse(req.body);
  const poll = db.prepare('SELECT * FROM polls WHERE id = ? AND is_active = 1').get(req.params.id) as any;
  if (!poll) { res.status(404).json({ success: false, error: { message: 'Poll not found' } }); return; }

  const options = JSON.parse(poll.options);
  if (optionIndex < 0 || optionIndex >= options.length) {
    res.status(400).json({ success: false, error: { message: 'Invalid option' } }); return;
  }

  try {
    db.prepare('INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)').run(req.params.id, req.user!.id, optionIndex);
  } catch {
    // Already voted — update
    db.prepare('UPDATE poll_votes SET option_index = ? WHERE poll_id = ? AND user_id = ?').run(optionIndex, req.params.id, req.user!.id);
  }

  res.json({ success: true });
}));

export { router as pollsRouter };
