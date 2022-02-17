const modalWrapper = document.querySelector('.modal-wrapper');
// modal add
const addModal = document.querySelector('.add-modal');
const addModalForm = document.querySelector('.add-modal .form');

// modal edit
const editModal = document.querySelector('.edit-modal');
const editModalForm = document.querySelector('.edit-modal .form');

const btnAdd = document.querySelector('.btn-add');

const tablecategoriaTimeline = document.querySelector('.table-categoriaTimeline');

let id;

// Create element and render categoriaTimeline
const rendercategoriaTimeline = doc => {
  const tr = `
    <tr data-id='${doc.id}'>
      <td>${doc.data().nome}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    </tr>
  `;
  tablecategoriaTimeline.insertAdjacentHTML('beforeend', tr);

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
    db.collection('categoriaTimeline').doc(`${doc.id}`).delete().then(() => {
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

// Get all categoriaTimeline
// db.collection('categoriaTimeline').get().then(querySnapshot => {
//   querySnapshot.forEach(doc => {
//     rendercategoriaTimeline(doc);
//   })
// });

// Real time listener
db.collection('categoriaTimeline').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if(change.type === 'added') {
      rendercategoriaTimeline(change.doc);
    }
    if(change.type === 'removed') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tablecategoriaTimeline.removeChild(tbody);
    }
    if(change.type === 'modified') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tablecategoriaTimeline.removeChild(tbody);
      rendercategoriaTimeline(change.doc);
    }
  })
})

// Click submit in add modal
addModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('categoriaTimeline').add({
    nome: addModalForm.nome.value
  });
  modalWrapper.classList.remove('modal-show');
});

// Click submit in edit modal
editModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('categoriaTimeline').doc(id).update({
    nome: editModalForm.nome.value
  });
  editModal.classList.remove('modal-show');
  
});
