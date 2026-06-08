const express = require('express')
const { MongoClient } = require('mongodb')

const app = express()
app.use(express.json())

const url = 'mongodb://localhost:27017'
const client = new MongoClient(url)
let db

client.connect()
  .then(() => {
    db = client.db('bibliotheque_livres')
    console.log('mongodb connectee')
    app.listen(3001, () => console.log('Livre service demarre sur le port 3001'))
  })
  .catch(err => console.log(err))


app.get('/livres', async (req, res) => {
  try {
    const livres = await db.collection('livres').find({}).toArray()
    res.status(200).json(livres)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.get('/livres/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const livre = await db.collection('livres').findOne({ id })
    if (!livre) return res.status(404).json({ message: 'Livre non trouve' })
    res.status(200).json(livre)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.post('/livres', async (req, res) => {
  try {
    const livres = await db.collection('livres').find({}).toArray()
    const newLivre = {
      id: livres.length > 0 ? Math.max(...livres.map(l => l.id)) + 1 : 1,
      titre: req.body.titre,
      auteur: req.body.auteur,
      disponible: true
    }
    await db.collection('livres').insertOne(newLivre)
    res.status(201).json(newLivre)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.put('/livres/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await db.collection('livres').updateOne(
      { id },
      { $set: { titre: req.body.titre, auteur: req.body.auteur } }
    )
    if (result.matchedCount === 0) return res.status(404).json({ message: 'Livre non trouve' })
    const updated = await db.collection('livres').findOne({ id })
    res.status(200).json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.patch('/livres/:id/disponibilite', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await db.collection('livres').updateOne(
      { id },
      { $set: { disponible: req.body.disponible } }
    )
    res.status(200).json({ message: 'disponibilite mise a jour' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


app.delete('/livres/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await db.collection('livres').deleteOne({ id })
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Livre non trouve' })
    res.status(200).json({ message: 'Livre supprime' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})