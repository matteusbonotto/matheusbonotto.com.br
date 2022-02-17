const modalWrapper = document.querySelector('.modal-wrapper');
// modal add
const addModal = document.querySelector('.add-modal');
const addModalForm = document.querySelector('.add-modal .form');

// modal edit
const editModal = document.querySelector('.edit-modal');
const editModalForm = document.querySelector('.edit-modal .form');

const btnAdd = document.querySelector('.btn-add');

const tableprojetos = document.querySelector('.table-projetos');

let id;

// Create element and render projetos
const renderProjetos = doc => {
  const tr = `
    <tr data-id='${doc.id}'>
      <td>${doc.data().titulo}</td>
      <td>${doc.data().subtitulo}</td>
      <td>${doc.data().categoria}</td>
      <td>${doc.data().descricao}</td>
      <td>
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-delete">Delete</button>
      </td>
    </tr>
  `;
  tableprojetos.insertAdjacentHTML('beforeend', tr);

  // Click edit user
  const btnEdit = document.querySelector(`[data-id='${doc.id}'] .btn-edit`);
  btnEdit.addEventListener('click', () => {
    editModal.classList.add('modal-show');

    id = doc.id;
    editModalForm.titulo.value = doc.data().titulo;
    editModalForm.subtitulo.value = doc.data().subtitulo;
    editModalForm.categoria.value = doc.data().categoria;
    editModalForm.descricao.value = doc.data().descricao;

  });

  // Click delete user
  const btnDelete = document.querySelector(`[data-id='${doc.id}'] .btn-delete`);
  btnDelete.addEventListener('click', () => {
    db.collection('projetos').doc(`${doc.id}`).delete().then(() => {
      console.log('Document succesfully deleted!');
    }).catch(err => {
      console.log('Error removing document', err);
    });
  });

}

// Click add user button
btnAdd.addEventListener('click', () => {
  addModal.classList.add('modal-show');

  addModalForm.titulo.value = '';
  addModalForm.subtitulo.value = '';
  addModalForm.categoria.value = '';
  addModalForm.descricao.value = '';
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

// Get all projetos
// db.collection('projetos').get().then(querySnapshot => {
//   querySnapshot.forEach(doc => {
//     renderProjetos(doc);
//   })
// });

// Real time listener
db.collection('projetos').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if(change.type === 'added') {
      renderProjetos(change.doc);
    }
    if(change.type === 'removed') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tableprojetos.removeChild(tbody);
    }
    if(change.type === 'modified') {
      let tr = document.querySelector(`[data-id='${change.doc.id}']`);
      let tbody = tr.parentElement;
      tableprojetos.removeChild(tbody);
      renderProjetos(change.doc);
    }
  })
})

// Click submit in add modal
addModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('projetos').add({
    titulo: addModalForm.titulo.value,
    subtitulo: addModalForm.subtitulo.value,
    categoria: addModalForm.categoria.value,
    descricao: addModalForm.descricao.value,
  });
  modalWrapper.classList.remove('modal-show');
});

// Click submit in edit modal
editModalForm.addEventListener('submit', e => {
  e.preventDefault();
  db.collection('projetos').doc(id).update({
    titulo: editModalForm.titulo.value,
    subtitulo: editModalForm.subtitulo.value,
    categoria: editModalForm.categoria.value,
    descricao: editModalForm.descricao.value,
  });
  editModal.classList.remove('modal-show');
  
});
