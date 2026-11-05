import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const migration = fs.readFileSync(new URL('../../backend/src/main/resources/product_images.sql', import.meta.url), 'utf8')
const oldChair = 'https://images.unsplash.com/photo-1580481077190-736134b223c6?auto=format&fit=crop&w=900&q=85'
const oldShelf = 'https://images.unsplash.com/photo-1594671581654-27d5303d3d45?auto=format&fit=crop&w=900&q=85'
const db = await PGlite.create()
try {
  await db.exec('CREATE TABLE products (id bigint, image_url text)')
  await db.query('INSERT INTO products VALUES (13, $1), (14, $2), (15, $1)', [oldChair, oldShelf])
  await db.exec(migration) // A fresh database may not have the gallery table yet.
  assert.deepEqual((await db.query('SELECT image_url FROM products ORDER BY id')).rows.map(row => row.image_url), [
    '/images/ghe_ergo.jpg', '/images/ke_5_tang.jpg', oldChair,
  ])
  await db.exec('CREATE TABLE product_images (product_id bigint, image_url text)')
  await db.query('INSERT INTO product_images VALUES (13, $1), (14, $2), (13, $3)', [oldChair, oldShelf, '/uploads/custom.jpg'])
  await db.exec("UPDATE products SET image_url = '/uploads/custom.jpg' WHERE id = 13")
  await db.exec(migration)
  await db.exec(migration)
  assert.equal((await db.query('SELECT image_url FROM products WHERE id = 13')).rows[0].image_url, '/uploads/custom.jpg')
  assert.deepEqual((await db.query('SELECT image_url FROM product_images ORDER BY image_url')).rows.map(row => row.image_url), [
    '/images/ghe_ergo.jpg', '/images/ke_5_tang.jpg', '/uploads/custom.jpg',
  ])
  for (const name of ['ghe_ergo.jpg', 'ke_5_tang.jpg']) {
    assert.ok(fs.statSync(new URL(`../../frontend/public/images/${name}`, import.meta.url)).size > 0)
  }
  console.log('PASS: sample images repaired, repeat runs safe, custom images preserved')
} finally {
  await db.close()
}
