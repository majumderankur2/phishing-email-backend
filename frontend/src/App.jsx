
import { useState } from 'react'
import axios from 'axios'

export default function App() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)

  const analyze = async () => {
    const res = await axios.post('http://127.0.0.1:5000/analyze', { email })
    setResult(res.data)
  }

  return (
    <div style={{padding:'40px'}}>
      <h1>AI Phishing Email Detector</h1>
      <textarea
        rows="10"
        style={{width:'100%',padding:'10px'}}
        placeholder="Paste suspicious email here..."
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />
      <button
        onClick={analyze}
        style={{
          marginTop:'20px',
          padding:'12px 24px',
          background:'#3b82f6',
          color:'white',
          border:'none',
          cursor:'pointer'
        }}
      >
        Analyze Email
      </button>

      {result && (
        <div style={{marginTop:'30px'}}>
          <h2>Prediction: {result.prediction}</h2>
          <h3>Confidence: {result.confidence}%</h3>
        </div>
      )}
    </div>
  )
}
