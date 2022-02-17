const modalWrapper = document.querySelector('.modal-wrapper');
// modal add
const addModal = document.querySelector('.add-modal');
const addModalForm = document.querySelector('.add-modal .form');

// modal edit
const editModal = document.querySelector('.edit-modal');
const editModalForm = document.querySelector('.edit-modal .form');

const btnAdd = document.querySelector('.btn-add');

const tablecategoriaSkills = document.querySelector('.table-categoriaSkills');

let id;

// Create element and render categoriaSkills
const rendercategoriaSkills = doc => {
  const tr = `
    <tr data-id='${doc.id}'>
      <td>${doc.data().nome}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    </tr>
  `;
  tablecategoriaSkills.insertAdjacentHTML('beforeend', tr);

  // Click edit user
  const btnEdit = document.querySelector(`[data-id='${doc.id}'] .btn-edit`);
  btnEdit.addEventListener('click', () => {
    editModal.classList.add('modal-show');

    id = doc.id;
    editModalForm.nome.value = doc.data().nome;
  });

  // Click delete user
  const btnDelete = document.querySelector(`[data-id='${doc.id}'] .btn-delete`);
  btnDelete.addEventListener('click', () => {
    db.collection('categoriaSkills').doc(`${doc.id}`).delete().then(() => {
      console.log('Document succesfully deleted!');
    }).catch(err => {
      console.log('Error removing document', err);
    });
  });

}

// Click add user button
btnAdd.addEventListener('click', () => {
  addModal.classList.add('modal-show');

  addModalForm.nome.value = '';
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

// Get all categoriaSkills
// db.collection('categoriaSkills').get().then(querySnapshot => {
//   querySnapshot.forEach(doc => {
//     rendercategoriaSkills(doc);
//   })
// });

// Real time listener
db.collection('categoriaSkills').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if(change.type === 'added') {
      rendercategoriaSkills(change.doc);
    }
    if(change.type === 'removed') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tablecategoriaSkills.removeChild(tbody);
    }
    if(change.type === 'modified') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tablecategoriaSkills.removeChild(tbody);
      rendercategoriaSkills(change.doc);
    }
  })
})

// Click submit in add modal
addModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('categoriaSkills').add({
    nome: addModalForm.nome.value
  });
  modalWrapper.classList.remove('modal-show');
});

// Click submit in edit modal
editModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('categoriaSkills').doc(id).update({
    nome: editModalForm.nome.value
  });
  editModal.classList.remove('modal-show');
  
});
