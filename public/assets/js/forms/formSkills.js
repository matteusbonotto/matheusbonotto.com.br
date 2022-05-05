const modalWrapper = document.querySelector('.modal-wrapper');
// modal add
const addModal = document.querySelector('.add-modal');
const addModalForm = document.querySelector('.add-modal .form');

// modal edit
const editModal = document.querySelector('.edit-modal');
const editModalForm = document.querySelector('.edit-modal .form');

const btnAdd = document.querySelector('.btn-add');


const tableskills = document.querySelector('.table-skills');

let id;

// Create element and render skills
const renderUser = doc => {
  const tr = `
    <tr data-id='${doc.id}'>
      <td>${doc.data().nome}</td>
      <td>${doc.data().categoria}</td>
      <td>${doc.data().descricao}</td>
      <td>${doc.data().nivelConhecimento}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    </tr>
  `;
  tableskills.insertAdjacentHTML('beforeend', tr);


  // Click edit user
  const btnEdit = document.querySelector(`[data-id='${doc.id}'] .btn-edit`);
  btnEdit.addEventListener('click', () => {
    editModal.classList.add('modal-show');

    id = doc.id;
    editModalForm.nome.value = doc.data().nome
    editModalForm.categoria.value = doc.data().categoria
    editModalForm.descricao.value = doc.data().descricao
    editModalForm.nivelConhecimento.value = doc.data().nivelConhecimento
  });

  // Click delete user
  const btnDelete = document.querySelector(`[data-id='${doc.id}'] .btn-delete`);
  btnDelete.addEventListener('click', () => {
    db.collection('skills').doc(`${doc.id}`).delete().then(() => {
      console.log('Document succesfully deleted!');
    }).catch(err => {
      console.log('Error removing document', err);
    });
  });
}

// Click add user button
btnAdd.addEventListener('click', () => {
  addModal.classList.add('modal-show');

  addModalForm.nome.value = ""
  addModalForm.categoria.value = ""
  addModalForm.descricao.value = ""
  addModalForm.nivelConhecimento.value = ""
});

// User click anyware outside the modal
window.addEventListener('click', e => {
  if(e.target === addModal) {
    addModal.classList.remove('modal-show');
  }
  if(e.target === editModal) {
    editModal.classList.remove('modal-show');
  }
});

// Get all skills
// db.collection('skills').get().then(querySnapshot => {
//   querySnapshot.forEach(doc => {
//     renderUser(doc);
//   })
// });

// Real time listener
db.collection('skills').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if(change.type === 'added') {
      renderUser(change.doc);
    }
    if(change.type === 'removed') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tableskills.removeChild(tbody);
    }
    if(change.type === 'modified') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tableskills.removeChild(tbody);
      renderUser(change.doc);
    }
  })
})

// Click submit in add modal
addModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('skills').add({
    nome: addModalForm.nome.value,
    categoria: addModalForm.categoria.value,
    descricao: addModalForm.descricao.value,
    nivelConhecimento: addModalForm.nivelConhecimento.value
  });
  modalWrapper.classList.remove('modal-show');
});

// Click submit in edit modal
editModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('skills').doc(id).update({
    nome: editModalForm.nome.value,
    categoria: editModalForm.categoria.value,
    descricao: editModalForm.descricao.value,
    nivelConhecimento: editModalForm.nivelConhecimento.value
  });
  editModal.classList.remove('modal-show');
  
});
