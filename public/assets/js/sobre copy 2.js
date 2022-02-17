   //db.collection('projetos') entra na tabela "projetos"
   //.get() euy pego od dados da tabela
   //.where('param', ''==' , 'valor') para pegar algo especifico
   //quey variavel receberá oque peguei do banco
   //=> executa function
   const projetos = [];                               //array que foi cirado para pegar os dados da tabela de projetos
    db.collection('sobre').get().then((query) => { //to pegando os dados da tablea 'projetos' e depois que pegar os dados ele executa uma função
    console.log(query)                                //vejo oque esta chegando na variavel 'query' pelo console
    query.docs.forEach(element => {                   //pego os dados que vieram na variavel query e realizo um laço de repetição que fara o seguinte
    projetos.push(element.data())                     //A cadaelemento da tabela  'projetos' eu adiciono na o meu array projetos o elemento que retornou odo 'query'
   });                                
   console.log('p2', projetos[1])                     //Confiuro se os dados vieram para meu array
   
   //crio uma variavel e ele recebe o id do elemento do site como um <h3>
   dt = document.getElementById('dtNascimento')       
   tel = document.getElementById('telefone') 
   ide = document.getElementById('idade') 
   cid = document.getElementById('cidade') 
   fre = document.getElementById('freelancer') 
   ema = document.getElementById('Email') 
   tit = document.getElementById('titulo') 
   desc = document.getElementById('descricao') 

   //e mudo o texto para o valor q esta no array, escolhendo o indice.nome do atributo
   dt.innerText = projetos[0].nascimento 
   tel.innerText = projetos[0].telefone    
   ide.innerText = projetos[0].idade    
   cid.innerText = projetos[0].cidade
   fre.innerText = projetos[0].Freelance
   ema.innerText = projetos[0].email
   tit.innerText = projetos[0].titulo
   desc.innerText = projetos[0].descricao
                                                
   }).catch((error) => { //trata o erro
        console.log("Error getting documents: ", error);
    });
    console.log('p1', projetos) //prova que toda vez q iniciar o site o projetos estará vazio