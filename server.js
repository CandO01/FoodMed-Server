import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { error } from 'node:console'

const PORT = 5223
const usersPath = path.resolve('./users.json')

const server = http.createServer((req, res)=>{
  //CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

   //--------POST / Sign up--------------

   if(req.url==='/signup' && req.method==='POST'){
    let body ='';
    req.on('data', (chunk)=>{
      body +=chunk.toString()
    })

    req.on('end', ()=>{
      try {
        const { name, email, password, confirm } = JSON.parse(body)
        if(!name || !email || !password || !confirm){
          throw new Error('Name, email and passwod are required')
        } 
        if(password !==confirm){
          throw new Error('Password do not match')
        }

        fs.readFile(usersPath, 'utf8', (err, data)=>{
          if(err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({error: 'Server error reading users'}));
            return;
          }

          const users = data ? JSON.parse(data) : []
          const userExists = users.some(u=>u.email === email)

          if(userExists) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({error: 'User already exists'}));
            return;
          }
        
            users.push({ name, email, password });
          
            fs.writeFile(usersPath, JSON.stringify(users, null, 2), err=> {
              if(err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({error: 'Error saving user'}));
                return;
              }
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({message: 'You have sign up successfully!!!', redirect: '/login'}));
                return;
            })

        });
         
        
      } catch (err) {
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }));
      }
    })
   }

   //---------POST / Sign in----------

   else if(req.url === '/login' && req.method === 'POST'){
      let body = ''

      req.on('data', (chunk)=>{
        body +=chunk.toString()
      })

      req.on('end', ()=>{
        try {
          const { name, email, password } = JSON.parse(body)

          if(!name || !email || !password){
           throw new Error('Your name, email and password required')
          }

          fs.readFile(usersPath, 'utf8', (err, data)=>{
            if(err){
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Server error reading users' }))
            }
            const users = JSON.parse(data || '[]')
            const user = users.find(u=>u.email === email && u.password === password)

            if(user){
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ message: 'Login successful', redirect: '/home' }))
            } else{
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid email or password' }))
            }
          })
        } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
        }
      })
   }
   //--------Catch-All -------

   else{
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Route not found' }))
   }
})

server.listen(PORT, ()=>console.log(`Connected to server: ${PORT}`))