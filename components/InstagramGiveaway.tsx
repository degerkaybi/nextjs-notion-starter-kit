'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Instagram, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Sparkles, 
  RefreshCw, 
  Filter, 
  Share2, 
  Check, 
  FileText,
  AlertCircle,
  Award,
  Users,
  CheckSquare,
  Square,
  Volume2,
  Tv,
  Terminal,
  Copy,
  Zap,
  Trash2,
  ClipboardPaste
} from 'lucide-react'

export interface InstagramComment {
  id: string
  username: string
  avatarUrl: string
  text: string
  timestamp: string
  isSelected: boolean // Host manual selection toggle for live stream
  matchesAnswer: boolean
}

export interface DrawResult {
  artworkWinner: InstagramComment
  stickerWinner: InstagramComment | null
  drawTime: string
  seedHash: string
}

export default function InstagramGiveaway() {
  // Inputs & Filters
  const [targetAnswer, setTargetAnswer] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [customInput, setCustomInput] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState<string>('')

  // Comments & Selection State
  const [comments, setComments] = useState<InstagramComment[]>([])

  // Winner Draw & Animation State
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [spinningName, setSpinningName] = useState<string>('')
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null)
  const [showConfetti, setShowConfetti] = useState<boolean>(false)

  // Strict answer matching: checks if the comment contains the exact target number
  const checkAnswerMatch = (commentText: string, target: string): boolean => {
    if (target === '') return true
    const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(?:^|\\s|[^0-9])${escapedTarget}(?:$|\\s|[^0-9])`, 'i')
    return regex.test(commentText) || commentText.trim().toLowerCase() === target
  }

  // Auto-update match status when target answer changes
  useEffect(() => {
    if (comments.length > 0) {
      const targetClean = targetAnswer.trim().toLowerCase()
      setComments(prev => prev.map(c => {
        const matches = checkAnswerMatch(c.text, targetClean)
        return {
          ...c,
          matchesAnswer: matches,
          isSelected: matches
        }
      }))
    }
  }, [targetAnswer])

  // Smart Instagram copy-paste parser: handles multi-line IG web dumps, markdown links, and all formats
  const parseCommentsFromText = (rawText: string, answer: string) => {
    if (!rawText.trim()) {
      setComments([])
      setStatusMessage('')
      return
    }

    const targetClean = answer.trim().toLowerCase()
    const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '')

    const isIgUsername = (str: string) => {
      const clean = str.replace('@', '').trim()
      return /^[a-zA-Z0-9._]{1,30}$/.test(clean) && !['https', 'http', 'instagram', 'www', 'profile', 'picture'].includes(clean.toLowerCase())
    }

    const isNoiseLine = (line: string): boolean => {
      const lower = line.toLowerCase().trim()
      
      // Instagram action buttons / UI labels
      if (['yanıtla', 'yanıtları gör', 'takip et', '• takip et', 'düzenlendi', 'beğen', 'cevapla', 'paylaş'].includes(lower)) return true
      if (/^(daha fazla|tümünü|daha|az)\b/i.test(lower)) return true
      if (lower.includes('profile picture') || lower.includes("'s profile picture")) return true
      
      // Plain timestamps: e.g. "2d", "1d", "42m", "6d", "5h", "2w", "30s"
      if (/^\d+[smhdwy]$/i.test(lower)) return true
      if (/^\d+\s*(s|dk|saat|gün|hafta|ay|yıl)\b/i.test(lower)) return true
      if (/^\d+\s*beğenme\b/i.test(lower)) return true
      
      // Markdown timestamp links: e.g. "[2d](https://www.instagram.com/p/...)" or "[42m](...)"
      if (/^\[\d+[smhdwy]\]\([^\)]+\)$/i.test(lower)) return true
      if (/^\[\d+\s*(s|dk|saat|gün|hafta)\]\([^\)]+\)$/i.test(lower)) return true
      if (lower.includes('/c/') && lower.includes('/p/')) return true // Comment permalink markdown link

      return false
    }

    // Step 1: Normalize lines and filter noise
    const cleanLines: string[] = []

    for (const line of rawLines) {
      if (isNoiseLine(line)) continue

      // Check if line is a markdown profile link: e.g. "[yazguvendi](https://www.instagram.com/yazguvendi/)"
      const mdProfileMatch = line.match(/^\[([a-zA-Z0-9._]{1,30})\]\((?:https?:\/\/)?(?:www\.)?instagram\.com\/[^\)]+\)$/i)
      if (mdProfileMatch) {
        const username = mdProfileMatch[1]
        if (!['p', 'reel', 'stories', 'explore', 'direct'].includes(username.toLowerCase())) {
          cleanLines.push(username)
          continue
        }
      }

      // Check if line is an Instagram URL: e.g. "https://www.instagram.com/yazguvendi/"
      const rawUrlMatch = line.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?$/i)
      if (rawUrlMatch) {
        const username = rawUrlMatch[1]
        if (!['p', 'reel', 'stories', 'explore', 'direct'].includes(username.toLowerCase())) {
          cleanLines.push(username)
          continue
        }
      }

      // Otherwise keep cleaned line
      cleanLines.push(line)
    }

    const parsedComments: InstagramComment[] = []

    let i = 0
    while (i < cleanLines.length) {
      const currentLine = cleanLines[i]

      // Format A: "@username: comment text" or "username: comment text"
      if (currentLine.includes(':')) {
        const colonIdx = currentLine.indexOf(':')
        const possibleUser = currentLine.substring(0, colonIdx).replace('@', '').trim()
        const possibleText = currentLine.substring(colonIdx + 1).trim()

        if (possibleUser && possibleText && isIgUsername(possibleUser)) {
          const matches = checkAnswerMatch(possibleText, targetClean)
          parsedComments.push({
            id: `custom_${parsedComments.length}_${Date.now()}_${Math.random()}`,
            username: possibleUser,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${possibleUser}`,
            text: possibleText,
            timestamp: 'Şimdi',
            isSelected: targetClean === '' ? true : matches,
            matchesAnswer: matches
          })
          i++
          continue
        }
      }

      // Format B: Multi-line (Line i is Username, Line i+1 is Comment Text)
      if (isIgUsername(currentLine) && i + 1 < cleanLines.length) {
        const username = currentLine.replace('@', '').trim()
        const nextLine = cleanLines[i + 1]
        const text = nextLine
        const matches = checkAnswerMatch(text, targetClean)

        parsedComments.push({
          id: `custom_${parsedComments.length}_${Date.now()}_${Math.random()}`,
          username,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          text,
          timestamp: 'Şimdi',
          isSelected: targetClean === '' ? true : matches,
          matchesAnswer: matches
        })
        i += 2
        continue
      }

      // Format C: Inline "@username comment text"
      if (currentLine.startsWith('@') && currentLine.includes(' ')) {
        const spaceIdx = currentLine.indexOf(' ')
        const possibleUser = currentLine.substring(1, spaceIdx).trim()
        const possibleText = currentLine.substring(spaceIdx + 1).trim()

        if (isIgUsername(possibleUser) && possibleText) {
          const matches = checkAnswerMatch(possibleText, targetClean)
          parsedComments.push({
            id: `custom_${parsedComments.length}_${Date.now()}_${Math.random()}`,
            username: possibleUser,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${possibleUser}`,
            text: possibleText,
            timestamp: 'Şimdi',
            isSelected: targetClean === '' ? true : matches,
            matchesAnswer: matches
          })
          i++
          continue
        }
      }

      // Fallback single line
      const matches = checkAnswerMatch(currentLine, targetClean)
      parsedComments.push({
        id: `custom_${parsedComments.length}_${Date.now()}_${Math.random()}`,
        username: `katilimci_${parsedComments.length + 1}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsedComments.length}`,
        text: currentLine,
        timestamp: 'Şimdi',
        isSelected: targetClean === '' ? true : matches,
        matchesAnswer: matches
      })
      i++
    }

    // Deduplicate by username (case-insensitive) - Each account gets exactly 1 entry in the draw pool
    const uniqueMap = new Map<string, InstagramComment>()
    for (const item of parsedComments) {
      const userKey = item.username.toLowerCase()
      if (!uniqueMap.has(userKey)) {
        uniqueMap.set(userKey, item)
      } else {
        // If the user was already added, but this comment has the correct answer, keep the matching one
        const existing = uniqueMap.get(userKey)!
        if (!existing.matchesAnswer && item.matchesAnswer) {
          uniqueMap.set(userKey, item)
        }
      }
    }

    const uniqueComments = Array.from(uniqueMap.values())
    const duplicateCount = parsedComments.length - uniqueComments.length

    setComments(uniqueComments)
    const matchCount = uniqueComments.filter(c => c.matchesAnswer).length
    if (targetClean !== '') {
      setStatusMessage(
        `✅ ${uniqueComments.length} tekil katılımcı (${duplicateCount > 0 ? `${duplicateCount} mükerrer elendi, ` : ''}${matchCount} doğru cevap: "${targetClean}")`
      )
    } else {
      setStatusMessage(
        `✅ ${uniqueComments.length} tekil katılımcı havuza eklendi${duplicateCount > 0 ? ` (${duplicateCount} mükerrer yorum elendi)` : ''}`
      )
    }
  }

  const handleInputChange = (val: string) => {
    setCustomInput(val)
    parseCommentsFromText(val, targetAnswer)
  }

  const handleClearAll = () => {
    setCustomInput('')
    setComments([])
    setStatusMessage('')
    setDrawResult(null)
  }

  // Manual Checkbox Selection Handlers
  const toggleUserSelection = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, isSelected: !c.isSelected } : c))
  }

  const selectAllMatching = () => {
    const targetClean = targetAnswer.trim().toLowerCase()
    setComments(prev => prev.map(c => {
      const matches = checkAnswerMatch(c.text, targetClean)
      return {
        ...c,
        matchesAnswer: matches,
        isSelected: matches
      }
    }))
  }

  const uncheckWrongAnswers = () => {
    const targetClean = targetAnswer.trim().toLowerCase()
    setComments(prev => prev.map(c => {
      const matches = checkAnswerMatch(c.text, targetClean)
      return {
        ...c,
        matchesAnswer: matches,
        isSelected: matches ? c.isSelected : false
      }
    }))
  }

  const toggleSelectAll = (val: boolean) => {
    setComments(prev => prev.map(c => ({ ...c, isSelected: val })))
  }

  // Start Live Winner Wheel Animation
  const startLiveDraw = () => {
    const selectedPool = comments.filter(c => c.isSelected)
    if (selectedPool.length === 0) {
      alert('Çekilişe dahil edilmiş (işaretli) katılımcı bulunamadı!')
      return
    }

    setIsDrawing(true)
    setDrawResult(null)
    setShowConfetti(false)

    let counter = 0
    const totalTicks = 38
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * selectedPool.length)
      setSpinningName(`@${selectedPool[randomIndex].username}`)
      counter++

      if (counter >= totalTicks) {
        clearInterval(interval)
        
        // Pick 2 distinct winners: 1st for Original Artwork, 2nd for Sticker Set
        const shuffled = [...selectedPool].sort(() => 0.5 - Math.random())
        const artworkWinner = shuffled[0]
        const stickerWinner = shuffled.length > 1 ? shuffled[1] : null

        const hash = Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).substring(4).toUpperCase()

        setDrawResult({
          artworkWinner,
          stickerWinner,
          drawTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          seedHash: hash
        })

        setIsDrawing(false)
        setShowConfetti(true)

        setTimeout(() => setShowConfetti(false), 5000)
      }
    }, 85)
  }

  const selectedCount = comments.filter(c => c.isSelected).length
  const correctCount = comments.filter(c => c.matchesAnswer).length

  const filteredComments = comments.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="broadcast-giveaway-wrapper">
      {/* Dynamic Background Confetti Effect */}
      {showConfetti && (
        <div className="confetti-overlay">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                backgroundColor: ['#E1306C', '#833AB4', '#F77737', '#FFD700', '#00E5FF'][i % 5]
              }}
            />
          ))}
        </div>
      )}

      {/* Main Single-Screen Grid Layout */}
      <div className="broadcast-grid">
        
        {/* LEFT COLUMN: Controls & Participant Manager */}
        <div className="broadcast-left-panel glass-card">
          
          {/* Top Control Bar with Inline Paste Area */}
          <div className="compact-control-bar">
            <div className="control-bar-header">
              <div className="live-title-badge">
                <Tv size={16} className="live-dot" />
                <span>Yıkım Ekibi Çekiliş Modu</span>
              </div>

              <div className="input-box answer-box-inline">
                <Filter size={14} className="box-icon" />
                <input
                  type="text"
                  placeholder="Cevap Filtresi..."
                  value={targetAnswer}
                  onChange={(e) => setTargetAnswer(e.target.value)}
                  title="Cevap Filtresi (boş bırakılırsa tüm yorumlar çekilişe dahil edilir)"
                />
              </div>
            </div>

            {/* Direct Inline Paste Textarea (No Modal) */}
            <div className="inline-paste-container">
              <textarea
                className="inline-paste-textarea"
                rows={2}
                placeholder="Instagram'dan kopyalanan yorumları buraya doğrudan yapıştırın (Ctrl+V)..."
                value={customInput}
                onChange={(e) => handleInputChange(e.target.value)}
              />
              
              <div className="inline-paste-footer">
                <div className="paste-actions-left">
                  <button 
                    type="button" 
                    className="paste-action-btn load-btn"
                    onClick={() => parseCommentsFromText(customInput, targetAnswer)}
                    title="Listeyi Tekrar Ayrıştır"
                  >
                    <ClipboardPaste size={14} />
                    <span>Listeyi Yükle</span>
                  </button>

                  {customInput && (
                    <button 
                      type="button" 
                      className="paste-action-btn clear-btn"
                      onClick={handleClearAll}
                      title="Metni ve Katılımcıları Temizle"
                    >
                      <Trash2 size={13} />
                      <span>Temizle</span>
                    </button>
                  )}
                </div>

                {statusMessage && (
                  <div className="inline-status-badge">
                    <span>{statusMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Participant Selection Controls */}
          <div className="selection-toolbar">
            <div className="selection-stats">
              <span className="count-badge">
                Katılımcı Havuzu: <strong>{selectedCount}</strong> / {comments.length}
              </span>
            </div>

            <div className="quick-actions">
              <button type="button" className="action-chip pass-chip" onClick={selectAllMatching}>
                <CheckCircle2 size={13} /> Cevabı Uyanları Seç
              </button>
              {targetAnswer.trim() !== '' && (
                <button type="button" className="action-chip danger-chip" onClick={uncheckWrongAnswers}>
                  <XCircle size={13} /> Yanlışları Kaldır
                </button>
              )}
              <button type="button" className="action-chip" onClick={() => toggleSelectAll(true)}>
                Tümünü Seç
              </button>
              <button type="button" className="action-chip" onClick={() => toggleSelectAll(false)}>
                Temizle
              </button>
            </div>

            <div className="mini-search">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="Ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Compact Scrollable Participant List */}
          <div className="compact-participant-list">
            {filteredComments.length === 0 ? (
              <div className="empty-broadcast-state">
                <AlertCircle size={28} />
                <p>Henüz yorum listesi yapıştırılmadı.</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 4 }}>
                  Instagram'dan kopyaladığınız yorumları yukarıdaki alana Ctrl+V ile yapıştırın.
                </p>
              </div>
            ) : (
              filteredComments.map((c) => (
                <div 
                  key={c.id} 
                  className={`participant-row ${c.isSelected ? 'row-selected' : 'row-unselected'} ${targetAnswer.trim() !== '' && !c.matchesAnswer ? 'row-wrong-answer' : ''}`}
                  onClick={() => toggleUserSelection(c.id)}
                >
                  <button type="button" className="row-checkbox">
                    {c.isSelected ? (
                      <CheckSquare size={18} className="checkbox-checked" />
                    ) : (
                      <Square size={18} className="checkbox-unchecked" />
                    )}
                  </button>

                  <img 
                    src={c.avatarUrl} 
                    alt={c.username} 
                    className="row-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`
                    }}
                  />

                  <div className="row-info">
                    <div className="row-user-bar">
                      <span className="row-username">@{c.username}</span>
                      {targetAnswer.trim() !== '' && (
                        <span className={`row-match-chip ${c.matchesAnswer ? 'pass' : 'fail'}`}>
                          {c.matchesAnswer ? '✓ Cevap Uyuşuyor' : '✕ Yanlış Cevap'}
                        </span>
                      )}
                    </div>
                    <span className="row-text">"{c.text}"</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Stream Winner Wheel & Celebration Card */}
        <div className="broadcast-right-panel glass-card">
          
          <div className="live-wheel-header">
            <div className="live-wheel-title-row">
              <Trophy size={26} className="gold-trophy-icon" />
              <h2>Yıkım Ekibi Canlı Çekiliş</h2>
            </div>
            {comments.length > 0 && (
              <div className="live-correct-badge">
                {targetAnswer.trim() !== '' ? (
                  <span>🎯 Doğru Cevap: <strong>{correctCount}</strong> / {comments.length}</span>
                ) : (
                  <span>👥 Havuz: <strong>{selectedCount}</strong> Katılımcı</span>
                )}
              </div>
            )}
          </div>

          {/* Spinning Wheel Display Stage */}
          <div className={`live-wheel-stage ${isDrawing ? 'is-spinning' : ''}`}>
            {isDrawing ? (
              <div className="spinning-live-view">
                <RefreshCw size={36} className="spin accent-spin" />
                <span className="spinning-live-name">{spinningName}</span>
                <span className="spinning-live-sub">Kazanan belirleniyor...</span>
              </div>
            ) : drawResult ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="live-winner-card dual-winners"
              >
                <div className="winners-dual-grid">
                  {/* Artwork Winner */}
                  <div className="winner-subcard artwork">
                    <span className="winner-tag-title">🎨 ORİJİNAL ESER KAZANANI</span>
                    <img 
                      src={drawResult.artworkWinner.avatarUrl} 
                      alt={drawResult.artworkWinner.username} 
                      className="live-winner-avatar"
                    />
                    <h3 className="live-winner-username">@{drawResult.artworkWinner.username}</h3>
                    <p className="live-winner-comment">"{drawResult.artworkWinner.text}"</p>
                  </div>

                  {/* Sticker Set Winner */}
                  {drawResult.stickerWinner && (
                    <div className="winner-subcard sticker">
                      <span className="winner-tag-title">🏷️ STICKER SETİ KAZANANI</span>
                      <img 
                        src={drawResult.stickerWinner.avatarUrl} 
                        alt={drawResult.stickerWinner.username} 
                        className="live-winner-avatar"
                      />
                      <h3 className="live-winner-username">@{drawResult.stickerWinner.username}</h3>
                      <p className="live-winner-comment">"{drawResult.stickerWinner.text}"</p>
                    </div>
                  )}
                </div>

                <div className="live-winner-hash">
                  <span>Saat: {drawResult.drawTime}</span>
                  <span>ID: {drawResult.seedHash}</span>
                </div>
              </motion.div>
            ) : (
              <div className="ready-stage-box">
                <Sparkles size={42} className="sparkle-stage" />
                <h3>Çekilişe Hazır!</h3>
                {targetAnswer.trim() !== '' ? (
                  <>
                    <p>Doğru Cevap Veren (Havuzdaki): <strong>{selectedCount}</strong> / {comments.length}</p>
                    <span className="stage-filter-pill">Aranan Cevap: "{targetAnswer}"</span>
                  </>
                ) : (
                  <p>Havuzda <strong>{selectedCount}</strong> onaylı katılımcı yer alıyor.</p>
                )}
              </div>
            )}
          </div>

          {/* Big Draw Action Button */}
          <button
            type="button"
            className="broadcast-draw-btn gradient-btn"
            onClick={startLiveDraw}
            disabled={isDrawing || selectedCount === 0}
          >
            {isDrawing ? (
              <>
                <RefreshCw size={22} className="spin" />
                Çekiliş Yapılıyor...
              </>
            ) : (
              <>
                <Trophy size={22} />
                ÇEKİLİŞİ BAŞLAT (2 KAZANAN)
              </>
            )}
          </button>

          {drawResult && (
            <button
              type="button"
              className="copy-live-result-btn"
              onClick={() => {
                const summary = `🏆 YIKIM EKİBİ ÇEKİLİŞ SONUÇLARI:\n` +
                  `🎨 Orijinal Eser Kazananı: @${drawResult.artworkWinner.username} ("${drawResult.artworkWinner.text}")\n` +
                  (drawResult.stickerWinner ? `🏷️ Sticker Seti Kazananı: @${drawResult.stickerWinner.username} ("${drawResult.stickerWinner.text}")\n` : '') +
                  `Zaman: ${drawResult.drawTime} | ID: ${drawResult.seedHash}`
                navigator.clipboard.writeText(summary)
                alert('Çekiliş sonuçları panoya kopyalandı!')
              }}
            >
              <Share2 size={16} /> Sonuçları Kopyala
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

