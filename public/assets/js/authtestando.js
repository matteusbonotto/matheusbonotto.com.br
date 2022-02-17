function login(){
  const email = document.getElementById('email').value
  const senha = document.getElementById('senha').value
  firebase.auth()
  .signInWithEmailAndPassword(email, senha)
  .then( () => {
      alert('Logado com sucesso!')
   //   swal.fire({
    //      icon: "success",
    //      title: "teste",
      })
  .then( () => {
      setTimeout( () => {
          window.location.replace('admin.html')
      }, 500)
   })
  .catch((error) => {
      alert('Erro: ' + error.message)
      //swal.fire({
    ///  icon: "success",
    //  title: error.message,
      })
}

function sair(){
  const auth = getAuth();
signOut(auth).then(() => {
window.location.replace('index.html')
}).catch((error) => {
// An error happened.
});
}