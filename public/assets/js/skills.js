   //db.collection('skills') entra na tabela "skills"
   //.get() euy pego od dados da tabela
   //.where('param', ''==' , 'valor') para pegar algo especifico
   //quey variavel receberá oque peguei do banco
   //=> executa function
   const skills = [];                               //array que foi cirado para pegar os dados da tabela de skills
    db.collection('skills').get().then((query) => { //to pegando os dados da tablea 'skills' e depois que pegar os dados ele executa uma função
    console.log(query)                                //vejo oque esta chegando na variavel 'query' pelo console
    query.docs.forEach(element => {                   //pego os dados que vieram na variavel query e realizo um laço de repetição que fara o seguinte
    skills.push(element.data())                     //A cadaelemento da tabela  'skills' eu adiciono na o meu array skills o elemento que retornou odo 'query'
   });                                
   console.log('p2', skills[1])                     //Confiuro se os dados vieram para meu array
   
   //crio uma variavel e ele recebe o id do elemento do site como um <h3>
   nivelSkills = document.getElementById('nivel1') 
   nomeSkills = document.getElementById('nomeSkills1') 
   categoriaSkills = document.getElementById('categoriaSkills') 
   descricaoSkills = document.getElementById('descricaoSkills') 

   //e mudo o texto para o valor q esta no array, escolhendo o indice.nome do atributo
    nomeSkills.innerHTML = skills[0].nome
    nivelSkills.innerHTML = skills[0].nivelConhecimento

    nomeSkills.innerHTML = `
    <div class="progress">
    <span class="skill" id="nomeSkills1">${skills[0].nome}<i id="nivel1" class="val">${skills[0].nivelConhecimento}%</i></span> 
        <div class="progress-bar-wrap">
            <div class="progress-bar" role="progressbar" aria-valuenow="${skills[0].nivelConhecimento}" aria-valuemin="0" aria-valuemax="100"></div>  
        </div>
    </div>
`   
   }).catch((error) => { //trata o erro
        console.log("Error getting documents: ", error);
    });
    console.log('p1', skills) //prova que toda vez q iniciar o site o skills estará vazio