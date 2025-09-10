import express from 'express';
import fetch from 'node-fetch';
import Conversation from '../models/Ai-Conversation.js';
import { authMiddleware } from '../middlewares/auth.js';
const router = express.Router();

router.post('/chat', authMiddleware, async (req,res) => {
  try {
    const { conversationId, message } = req.body;
    // 1) load/create conversation
    let conversation = conversationId ? await Conversation.findById(conversationId) : null;
    if(!conversation) {
      conversation = new Conversation({
        title: 'New Chat',
        owner: req.user._id,
        participants: [req.user._id],
        messages: []
      });
    } else {
      // إذا مش موجود كـ participant ضيفه (اختياري)
      if(!conversation.participants.some(p => p.equals(req.user._id))) {
        conversation.participants.push(req.user._id);
      }
    }

    // 2) ذخّر رسالة المستخدم
    conversation.messages.push({
      sender: req.user._id,
      role: 'user',
      content: message
    });

    // 3) جهّز الرسائل للـ OpenAI (اختر آخر N رسائل أو لخص لو طويل)
    const apiMessages = conversation.messages.map(m => ({ role: m.role, content: m.content }));

    // 4) نادى على OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: apiMessages,
        max_tokens: 500
      })
    });
    const data = await openaiRes.json();
    const assistantMessage = data.choices?.[0]?.message?.content ?? '...';

    // 5) خزّن رد الـ AI
    conversation.messages.push({ sender: null, role: 'assistant', content: assistantMessage });

    await conversation.save();

    // 6) رجّع للفرونت مع conversationId عشان المستخدم يكمل لاحقًا
    res.json({ conversationId: conversation._id, reply: assistantMessage });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/conversations', authMiddleware, async (req,res)=>{
  const convs = await Conversation.find({ participants: req.user._id })
    .select('title messages.createdAt messages.content messages.role')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(convs);
});



export default router;
