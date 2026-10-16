import { useState } from 'react'
import './App.css'

const STORAGE_KEY = 'dukaan-note-transactions'

const exampleNotes = [
  'Sold 2 notebooks for ₹80',
  'Ramesh ko 2 kilo chawal 120 rupaye mein diya',
  'Bought 5 kg atta for ₹250',
]

const formatRupees = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)

function isValidStoredTransaction(transaction) {
  return (
    transaction &&
    (typeof transaction.id === 'string' || typeof transaction.id === 'number') &&
    typeof transaction.item === 'string' &&
    transaction.item.trim().length > 0 &&
    typeof transaction.quantity === 'number' &&
    Number.isFinite(transaction.quantity) &&
    transaction.quantity >= 0 &&
    typeof transaction.amount === 'number' &&
    Number.isFinite(transaction.amount) &&
    transaction.amount >= 0 &&
    (transaction.type === 'Sale' || transaction.type === 'Purchase')
  )
}

function loadTransactions() {
  try {
    const savedTransactions = window.localStorage.getItem(STORAGE_KEY)
    if (savedTransactions === null) {
      return { transactions: [], message: '' }
    }

    const parsedTransactions = JSON.parse(savedTransactions)
    if (
      !Array.isArray(parsedTransactions) ||
      !parsedTransactions.every(isValidStoredTransaction) ||
      new Set(parsedTransactions.map((transaction) => transaction.id)).size !==
        parsedTransactions.length
    ) {
      return {
        transactions: [],
        message: 'Saved ledger data was invalid, so it was not loaded. Confirm a new entry to start a fresh saved ledger.',
      }
    }

    return { transactions: parsedTransactions, message: '' }
  } catch {
    return {
      transactions: [],
      message: 'Saved ledger data could not be read. Confirm a new entry to start a fresh saved ledger.',
    }
  }
}

function validateDraftEntry(transaction) {
  const problems = []
  const quantity = transaction.quantity === '' ? NaN : Number(transaction.quantity)
  const amount = transaction.amount === '' ? NaN : Number(transaction.amount)

  if (!transaction.item.trim()) problems.push('item name is required')
  if (!Number.isFinite(quantity) || quantity < 0) {
    problems.push('quantity must be a valid non-negative number')
  }
  if (!Number.isFinite(amount) || amount < 0) {
    problems.push('amount must be a valid non-negative number')
  }
  if (transaction.type !== 'Sale' && transaction.type !== 'Purchase') {
    problems.push('choose Sale or Purchase')
  }

  return { problems, quantity, amount }
}

function App() {
  const [initialData] = useState(loadTransactions)
  const [note, setNote] = useState('')
  const [transactions, setTransactions] = useState(initialData.transactions)
  const [draft, setDraft] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [storageNotice, setStorageNotice] = useState(initialData.message)

  const totalFor = (type) =>
    transactions
      .filter((transaction) => transaction.type === type)
      .reduce((total, transaction) => total + transaction.amount, 0)

  const createDraft = async () => {
    if (!note.trim()) {
      setError('Please write or select a note first.')
      return
    }

    if (draft.length) {
      setError('Review, confirm, or discard the current draft before generating a new one.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('http://localhost:5000/api/parse-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Could not connect to the parsing server. Ensure the backend is running.')
        return
      }

      setDraft(result.transactions.map((transaction, index) => ({
        ...transaction,
        id: `${Date.now()}-${index}`,
      })))
      setMessage(`Draft generated using ${result.model}. Please review and edit before confirming.`)
    } catch {
      setError('Could not connect to the parsing server. Ensure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateDraft = (id, field, value) => {
    setDraft((currentDraft) =>
      currentDraft.map((transaction) =>
        transaction.id === id ? { ...transaction, [field]: value } : transaction,
      ),
    )
    setError('')
    setMessage('')
  }

  const removeDraftEntry = (id) => {
    setDraft((currentDraft) => currentDraft.filter((transaction) => transaction.id !== id))
    setError('')
    setMessage('')
  }

  const confirmDraft = () => {
    if (!draft.length) return

    const checkedDraft = draft.map((transaction) => ({
      transaction,
      validation: validateDraftEntry(transaction),
    }))
    const validEntries = checkedDraft.filter(({ validation }) => validation.problems.length === 0)
    const invalidEntries = checkedDraft.filter(({ validation }) => validation.problems.length > 0)

    if (!validEntries.length) {
      setError(
        `No entries were added. ${invalidEntries
          .map(({ transaction, validation }) => `${transaction.item.trim() || 'Unnamed entry'}: ${validation.problems.join(', ')}.`)
          .join(' ')}`,
      )
      setMessage('')
      return
    }

    const confirmedEntries = validEntries.map(({ transaction, validation }) => ({
      ...transaction,
      item: transaction.item.trim(),
      quantity: validation.quantity,
      amount: validation.amount,
    }))
    const updatedTransactions = [...confirmedEntries, ...transactions]
    setTransactions(updatedTransactions)
    setDraft(invalidEntries.map(({ transaction }) => transaction))
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTransactions))
      setStorageNotice('')
    } catch {
      setStorageNotice('Your confirmed entries are available for this page session, but could not be saved in this browser.')
    }
    setError(
      invalidEntries.length
        ? `${invalidEntries.length} draft ${invalidEntries.length === 1 ? 'entry remains' : 'entries remain'} and was not added: ${invalidEntries
            .map(({ transaction, validation }) => `${transaction.item.trim() || 'Unnamed entry'}: ${validation.problems.join(', ')}.`)
            .join(' ')}`
        : '',
    )
    setMessage(
      `${confirmedEntries.length} valid ${confirmedEntries.length === 1 ? 'entry' : 'entries'} added to the ledger.`,
    )
  }

  const discardDraft = () => {
    setDraft([])
    setError('')
    setMessage('')
  }

  const chooseExampleNote = (example) => {
    setNote(example)
    setMessage('Example note added to the text box only. It has not been interpreted.')
    setError('')
  }

  const salesTotal = totalFor('Sale')
  const purchasesTotal = totalFor('Purchase')

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="DukaanNote home">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>Dukaan<span className="brand-light">Note</span></span>
        </a>
        <span className="demo-pill"><span aria-hidden="true" /> Demo mode</span>
      </header>

      <div className="dashboard" id="home">
        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR DAILY HISAB, MADE SIMPLE</p>
            <h1>Good business starts with a clear hisaab.</h1>
            <p className="welcome-copy">
              A simple place to keep track of what comes in and what goes out.
            </p>
          </div>
          <div className="date-chip">
            <span className="date-icon" aria-hidden="true">▦</span>
            <span>Today <strong>· Demo ledger</strong></span>
          </div>
        </section>

        <section className="summary-section" aria-label="Ledger summary">
          <div className="sample-label"><span aria-hidden="true">ⓘ</span> SAMPLE DATA · CONFIRMED ENTRIES ONLY</div>
          <div className="summary-grid">
            <article className="summary-card sales-card">
              <div className="summary-icon" aria-hidden="true">↗</div>
              <div>
                <p>Total sales</p>
                <h2>{transactions.some((transaction) => transaction.type === 'Sale') ? formatRupees(salesTotal) : '—'}</h2>
                <span>{transactions.some((transaction) => transaction.type === 'Sale') ? 'From confirmed entries' : 'No confirmed sales yet'}</span>
              </div>
              <span className="summary-decoration" aria-hidden="true">₹</span>
            </article>
            <article className="summary-card purchases-card">
              <div className="summary-icon" aria-hidden="true">↙</div>
              <div>
                <p>Total purchases</p>
                <h2>{transactions.some((transaction) => transaction.type === 'Purchase') ? formatRupees(purchasesTotal) : '—'}</h2>
                <span>{transactions.some((transaction) => transaction.type === 'Purchase') ? 'From confirmed entries' : 'No confirmed purchases yet'}</span>
              </div>
              <span className="summary-decoration" aria-hidden="true">₹</span>
            </article>
          </div>
        </section>

        <section className="panel note-panel" aria-labelledby="note-heading">
          <div className="section-heading">
            <div className="heading-icon note-icon" aria-hidden="true">✎</div>
            <div>
              <h2 id="note-heading">Add a transaction note</h2>
              <p>Write naturally in English or Hinglish. Gemma 2 parses your note through the local backend.</p>
            </div>
          </div>
          <label className="sr-only" htmlFor="transaction-note">Transaction note</label>
          <textarea
            id="transaction-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Ramesh ko 2 kilo chawal 120 rupaye mein diya"
            rows={3}
          />
          <div className="example-notes" aria-label="Example notes">
            <span>Try an example:</span>
            {exampleNotes.map((example) => (
              <button
                className="example-note"
                key={example}
                type="button"
                onClick={() => chooseExampleNote(example)}
              >
                {example}
              </button>
            ))}
          </div>
          <div className="note-actions">
            <p className="mock-disclaimer">
              <span aria-hidden="true">ⓘ</span> Your note is parsed by Gemma 2 via the local backend; review and edit the resulting draft before confirming.
            </p>
            <button className="button button-primary" type="button" onClick={createDraft} disabled={isLoading}>
              {isLoading ? 'Parsing with Gemma...' : <>Generate Draft <span aria-hidden="true">→</span></>}
            </button>
          </div>
        </section>

        {message && <p className="status-message" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        {storageNotice && <p className="storage-message" role="status">{storageNotice}</p>}

        <section className="panel transactions-panel" aria-labelledby="draft-heading">
          <div className="panel-title-row">
            <div className="section-heading">
              <div className="heading-icon draft-icon" aria-hidden="true">▤</div>
              <div>
                <h2 id="draft-heading">Draft transactions</h2>
                <p>Review and edit parsed entries before confirming.</p>
              </div>
            </div>
            {draft.length > 0 && <span className="count-pill">{draft.length} to review</span>}
          </div>

          {draft.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Amount (₹)</th>
                      <th scope="col">Type</th>
                      <th scope="col"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <label className="sr-only" htmlFor={`item-${transaction.id}`}>Item</label>
                          <input
                            id={`item-${transaction.id}`}
                            className="table-input item-input"
                            value={transaction.item}
                            onChange={(event) => updateDraft(transaction.id, 'item', event.target.value)}
                          />
                        </td>
                        <td>
                          <label className="sr-only" htmlFor={`quantity-${transaction.id}`}>Quantity</label>
                          <input
                            id={`quantity-${transaction.id}`}
                            className="table-input number-input"
                            type="number"
                            min="0"
                            step="any"
                            value={transaction.quantity}
                            onChange={(event) => updateDraft(transaction.id, 'quantity', event.target.value)}
                          />
                        </td>
                        <td>
                          <label className="sr-only" htmlFor={`amount-${transaction.id}`}>Amount in rupees</label>
                          <div className="amount-field">
                            <span aria-hidden="true">₹</span>
                            <input
                              id={`amount-${transaction.id}`}
                              className="table-input number-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={transaction.amount}
                              onChange={(event) => updateDraft(transaction.id, 'amount', event.target.value)}
                            />
                          </div>
                        </td>
                        <td>
                          <label className="sr-only" htmlFor={`type-${transaction.id}`}>Transaction type</label>
                          <select
                            id={`type-${transaction.id}`}
                            className={`type-select ${transaction.type.toLowerCase()}`}
                            value={transaction.type}
                            onChange={(event) => updateDraft(transaction.id, 'type', event.target.value)}
                          >
                            <option>Sale</option>
                            <option>Purchase</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="remove-button"
                            type="button"
                            aria-label={`Remove ${transaction.item || 'unnamed'} from draft`}
                            onClick={() => removeDraftEntry(transaction.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="draft-actions">
                <button className="button button-text" type="button" onClick={discardDraft}>Discard all</button>
                <button className="button button-confirm" type="button" onClick={confirmDraft}>
                  Confirm valid entries <span aria-hidden="true">✓</span>
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">▤</span>
              <strong>No draft entries yet</strong>
              <span>Write or select a note, then choose “Generate Draft” to parse it for review.</span>
            </div>
          )}
        </section>

        <section className="panel history-panel" aria-labelledby="history-heading">
          <div className="panel-title-row">
            <div className="section-heading">
              <div className="heading-icon history-icon" aria-hidden="true">◷</div>
              <div>
                <h2 id="history-heading">Transaction history</h2>
                <p>Only confirmed entries appear here.</p>
              </div>
            </div>
            <span className="count-pill">{transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="history-sample-label">SAMPLE DATA · SAVED IN THIS BROWSER</div>
          {transactions.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="history-item">{transaction.item}</td>
                      <td>{transaction.quantity}</td>
                      <td className="history-amount">{formatRupees(transaction.amount)}</td>
                      <td>
                        <span className={`history-type ${transaction.type.toLowerCase()}`}>
                          <span aria-hidden="true" />{transaction.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">◷</span>
              <strong>No transactions confirmed yet</strong>
              <span>Confirm a valid draft entry to start your ledger. Summary totals appear after confirmation.</span>
            </div>
          )}
          <p className="history-footnote">
            {storageNotice
              ? 'Demo prototype only. Browser storage is unavailable or contains invalid data; check the notice above.'
              : 'Demo prototype only. Confirmed entries are saved in local storage on this browser.'}
          </p>
        </section>

        <footer className="footer">
          <span className="footer-brand">DukaanNote</span>
          <span>A simple hisaab for your shop.</span>
          <span className="footer-demo">Notes parsed by Gemma 2 via the local backend</span>
        </footer>
      </div>
    </main>
  )
}

export default App
