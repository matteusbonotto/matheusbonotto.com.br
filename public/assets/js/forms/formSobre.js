const modalWrapper = document.querySelector('.modal-wrapper');
// modal add
const addModal = document.querySelector('.add-modal');
const addModalForm = document.querySelector('.add-modal .form');

// modal edit
const editModal = document.querySelector('.edit-modal');
const editModalForm = document.querySelector('.edit-modal .form');

const btnAdd = document.querySelector('.btn-add');

const tablesobre = document.querySelector('.table-sobre');

let id;

// Create element and render sobre
const rendersobre = doc => {
  const tr = `
    <tr data-id='${doc.id}'>
    <td>${doc.data().titulo}</td>  
    <td>${doc.data().nome}</td>
    <td>${doc.data().nascimento}</td>
    <td>${doc.data().idade}</td>
      <td>${doc.data().email}</td>
      <td>${doc.data().descricao}</td>
      <td>${doc.data().telefone}</td>
      <td>${doc.data().cidade}</td>
      <td>${doc.data().Freelance}</td>  
      <td>${doc.data().imagem}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    </tr>
  `;
  tablesobre.insertAdjacentHTML('beforeend', tr);

  // Click edit sobre
  const btnEdit = document.querySelector(`[data-id='${doc.id}'] .btn-edit`);
  btnEdit.addEventListener('click', () => {
    editModal.classList.add('modal-show');

    id = doc.id;
   editModalForm.Freelance.value = doc.data().Freelance
   editModalForm.cidade.value = doc.data().cidade
   editModalForm.descricao.value = doc.data().descricao
   editModalForm.nome.value = doc.data().nome
   editModalForm.email.value = doc.data().email
   editModalForm.titulo.value = doc.data().titulo
   editModalForm.telefone.value = doc.data().telefone
   editModalForm.nascimento.value = doc.data().nascimento
   editModalForm.idade.value = doc.data().idade
   editModalForm.imagem.value = doc.data().imagem
  });

  // Click delete sobre
  const btnDelete = document.querySelector(`[data-id='${doc.id}'] .btn-delete`);
  btnDelete.addEventListener('click', () => {
    db.collection('sobre').doc(`${doc.id}`).delete().then(() => {
      console.log('Document succesfully deleted!');
    }).catch(err => {
      console.log('Error removing document', err);
    });
  });

}

// Click add sobre button
btnAdd.addEventListener('click', () => {
  addModal.classList.add('modal-show');

   editModalForm.Freelance.value = ""
   editModalForm.cidade.value = ""
   editModalForm.descricao.value = ""
   editModalForm.nome.value = ""
   editModalForm.email.value = ""
   editModalForm.titulo.value = ""
   editModalForm.telefone.value = ""
   editModalForm.nascimento.value = ""
   editModalForm.idade.value = ""
   editModalForm.imagem.value = ""
});

// sobre click anyware outside the modal
window.addEventListener('click', e => {
  if(e.target === addModal) {
    addModal.classList.remove('modal-show');
  }
  if(e.target === editModal) {
    editModal.classList.remove('modal-show');
  }
});

// Get all sobre
// db.collection('sobre').get().then(querySnapshot => {
//   querySnapshot.forEach(doc => {
//     rendersobre(doc);
//   })
// });

// Real time listener
db.collection('sobre').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if(change.type === 'added') {
      rendersobre(change.doc);
    }
    if(change.type === 'removed') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tablesobre.removeChild(tbody);
    }
    if(change.type === 'modified') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tablesobre.removeChild(tbody);
      rendersobre(change.doc);
    }
  })
})

// Click submit in add modal
addModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('sobre').add({
    Freelance: Freelance.value,
    cidade: cidade.value,
    descricao: descricao.value,
    nome: nome.value,
    email: email.value,
    titulo: titulo.value,
    telefone: telefone.value,
    nascimento: nascimento.value,
    idade: idade.value,
    imagem: imagem.value
  });
  modalWrapper.classList.remove('modal-show');
});

// Click submit in edit modal
editModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('sobre').doc(id).update({
    Freelance: editModalForm.Freelance.value,
    cidade: editModalForm.cidade.value,
    descricao: editModalForm.descricao.value,
    nome: editModalForm.nome.value,
    email: editModalForm.email.value,
    titulo: editModalForm.titulo.value,
    telefone: editModalForm.telefone.value,
    nascimento: editModalForm.nascimento.value,
    idade: editModalForm.idade.value,
    imagem: editModalForm.imagem.value
  });
  editModal.classList.remove('modal-show');
  
});
