 const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const customers = [];

app.use(express.json()) 

//middleware
function VerifyIfExistsAccountCPF(request, response, next) {

    const { cpf } = request.headers;
    const customer = customers.find((customer) => customer.cpf = cpf);

    if (!customer){
        return response.status(400).json({ error: "Customer not found" });
    }

    request.customer = customer;

    return next();

}

function getBalace(statement){
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    }, 0);
    
    return balance;
}

app.post("/account", (request, response) => {

    const { cpf, name } = request.body;

    // Verifica se o cpf já existe
    const customersAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    ); 

    if (customersAlreadyExists){
        return response.status(400).json({ error: "Customers already exists" });
    }

    // Definindo o Array
    customers.push({
        cpf, 
        name, 
        id: uuidv4(), 
        statement: []
    })

    return response.status(201).send();
  
});

app.get("/statement", VerifyIfExistsAccountCPF, (request, response) => {

    // 1º Exemplo
    //app.get("/statement/:cpf", (request, response) => {
    //const { cpf } = request.params;

    // 1º Exemplo
    //const { cpf } = request.headers;
    // Pesquisando o cpf
    //const customer = customers.find((customer) => customer.cpf = cpf);
    
    // Verifica se a conta existe
    
    const { customer } = request;

    return response.json(customer.statement);

}); 

app.post("/deposit", VerifyIfExistsAccountCPF, (request, response) => {

    const { description, amount } = request.body;

    
    const { customer } = request;
    
    const statementOperation = {
        description, 
        amount,
        create_ad: new Date(), 
        type: "credit"
    }
    
    customer.statement.push(statementOperation);
    
    return response.status(201).send();
    
});

app.post("/withdraw", VerifyIfExistsAccountCPF, (request, response) => {
    
    const { customer } = request;
    const { amount } = request.body;
    
    const balance = getBalace(customer.statement);
    
    if (balance < amount){
        return response.status(400).json({ error: "Insufficient funds!"});
    }
    
    const statementOperation = {
        amount,
        create_ad: new Date(), 
        type: "debit"
    };
    
    customer.statement.push(statementOperation);    

    return response.status(201).send();

});

app.get("/statement/date", VerifyIfExistsAccountCPF, (request, response) => {

    const { date } = request.query;
    const { customer } = request;
    
    const dateFormat = new Date(date + " 00:00");
    
    const statement = customer.statement.filter(
        (statement) => 
        statement.create_ad.toDateString() === new Date(dateFormat).toDateString()
    );

    return response.json(statement);

}); 

app.put("/account", VerifyIfExistsAccountCPF, (request, response) => {

    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();

}); 

app.get("/account", VerifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    return response.json(customer);
}); 

app.delete("/account", VerifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    customers.splice(customer, 1)

    return response.status(200).json(customers);

}); 

app.get("/balance", VerifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    
    const balance = getBalace(customer.statement);

    return response.json(balance);

}); 

app.listen(3333)
