const express = require('express')
const { MongoClient } = require('mongodb')

const app = express()
app.use(express.json())

const url = 'mongodb://localhost:27017'
const client = new MongoClient(url)
let db

client.connect()
  .then(() => {
    db = client.db('bibliotheque_membres')
    console.log('mongodb connectee')
    app.listen(3002, () => console.log('Membre service demarre sur le port 3002'))
  })
  .catch(err => console.log(err))


app.get('/membres', async (req, res) => {
  try {
    const membres = await db.collection('membres').find({}).toArray()
    res.status(200).json(membres)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.get('/membres/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const membre = await db.collection('membres').findOne({ id })
    if (!membre) return res.status(404).json({ message: 'Membre non trouve' })
    res.status(200).json(membre)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.post('/membres', async (req, res) => {
  try {
    const membres = await db.collection('membres').find({}).toArray()
    const newMembre = {
      id: membres.length > 0 ? Math.max(...membres.map(m => m.id)) + 1 : 1,
      nom: req.body.nom,
      email: req.body.email,
      actif: true
    }
    await db.collection('membres').insertOne(newMembre)
    res.status(201).json(newMembre)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.put('/membres/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await db.collection('membres').updateOne(
      { id },
      { $set: { nom: req.body.nom, email: req.body.email } }
    )
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Membre non trouve' })
    const updated = await db.collection('membres').findOne({ id })
    res.status(200).json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.delete('/membres/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await db.collection('membres').deleteOne({ id })
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Membre non trouve' })
    res.status(200).json({ message: 'Membre supprime' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})