const express = require('express')
const { MongoClient } = require('mongodb')
const axios = require('axios')

const app = express()
app.use(express.json())


const LIVRE_SERVICE = 'http://localhost:3001'
const MEMBRE_SERVICE = 'http://localhost:3002'

const url = 'mongodb://localhost:27017'
const client = new MongoClient(url)
let db

client.connect()
  .then(() => {
    db = client.db('bibliotheque_emprunts')
    console.log('mongodb connectee')
    app.listen(3003, () => console.log('Emprunt service demarre sur le port 3003'))
  })
  .catch(err => console.log(err))

app.get('/emprunts', async (req, res) => {
  try {
    const emprunts = await db.collection('emprunts').find({}).toArray()
    res.status(200).json(emprunts)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

app.get('/emprunts/en-cours', async (req, res) => {
  try {
    const emprunts = await db.collection('emprunts').find({ retourne: false }).toArray()
    res.status(200).json(emprunts)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

app.get('/emprunts/membre/:idMembre', async (req, res) => {
  try {
    const idMembre = parseInt(req.params.idMembre)
    const emprunts = await db.collection('emprunts').find({ idMembre }).toArray()
    res.status(200).json(emprunts)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

app.post('/emprunts', async (req, res) => {
  try {
    const { idMembre, idLivre } = req.body
    const livreRes = await axios.get(`${LIVRE_SERVICE}/livres/${idLivre}`)
    const livreData = livreRes.data
    if (!livreData.disponible)
      return res.status(400).json({ message: 'livre non disponible' })
    const membreRes = await axios.get(`${MEMBRE_SERVICE}/membres/${idMembre}`)
    const membreData = membreRes.data
    if (!membreData.actif)
      return res.status(400).json({ message: 'membre inactif' })
    const emprunts = await db.collection('emprunts').find({}).toArray()
    const newEmprunt = {
      id: emprunts.length > 0 ? Math.max(...emprunts.map(e => e.id)) + 1 : 1,
      idMembre: membreData.id,
      idLivre: livreData.id,
      nomMembre: membreData.nom,
      titreLivre: livreData.titre,
      dateEmprunt: new Date().toISOString(),
      dateRetour: null,
      retourne: false
    }
    await db.collection('emprunts').insertOne(newEmprunt)
    await axios.patch(`${LIVRE_SERVICE}/livres/${idLivre}/disponibilite`, { disponible: false })
    res.status(201).json(newEmprunt)
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ message: 'livre ou membre invalide' })
    return res.status(500).json({ message: err.message })
  }
})

app.patch('/emprunts/:id/retour', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const emprunt = await db.collection('emprunts').findOne({ id })
    if (!emprunt) return res.status(404).json({ message: 'emprunt non trouve' })
    if (emprunt.retourne) return res.status(400).json({ message: 'livre deja retourne' })
    await db.collection('emprunts').updateOne(
      { id },
      { $set: { retourne: true, dateRetour: new Date().toISOString() } }
    )
    await axios.patch(`${LIVRE_SERVICE}/livres/${emprunt.idLivre}/disponibilite`, { disponible: true })
    res.status(200).json({ message: 'livre retourne avec succes' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})

app.delete('/emprunts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const result = await db.collection('emprunts').deleteOne({ id })
    if (result.deletedCount === 0) return res.status(404).json({ message: 'emprunt non trouve' })
    res.status(200).json({ message: 'emprunt supprime' })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
})