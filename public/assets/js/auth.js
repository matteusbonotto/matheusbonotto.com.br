const btnLogin = document.getElementById('btnLogin')
const btnLogout = document.getElementById('btnLogout')

btnLogin.onclick = event => {
const email = document.getElementById('email').value
const senha = document.getElementById('senha').value
  firebase.auth()
  .signInWithEmailAndPassword(email, senha)
  .then( () => {alert('Logado com sucesso!')})
  .then( () => {
   window.location.replace('admin.html')
   })
  .catch((error) => {alert('Erro: ' + error.message)})
}


btnLogout.onclick = event =>{
  firebase.auth().singOut();
  alert("test")

}



