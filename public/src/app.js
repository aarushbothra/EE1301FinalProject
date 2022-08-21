{

    //form for difficulty selection
    for (const root2 of document.querySelectorAll(".inputName[data-url]")){
        const difficulty = document.createElement("div");

        difficulty.classList.add("inputName");

        difficulty.innerHTML = `
        <form action="/difficulty" method="POST" class="difficultyForm">
        <div>
          <label for="difficulty">Choose difficulty (e - easy, m - medium, h - hard)</label>
          <input type="text" id="difficulty" name="difficulty" />
        </div>
        <button type="submit" class="difficultyButton">Submit</button>
        </form>
        <p></p>
        `;

        root2.append(difficulty);

        difficulty.querySelector(".difficultyForm").addEventListener("submit", () => {
            updateGoogleSheet(root2);
        })
        
    }
    /**
     * populate a data table with some data
     * 
     * @param {HTMLDivElement} root
     * @param {HTMLDivElement} root2
     */
    async function updateTable(root){
        root.querySelector(".table-refresh__button").classList.add("table-refresh__button--refreshing")//spin the refresh button

        const table = root.querySelector(".table-refresh__table") 
        const response = await fetch(root.dataset.url);//fetch data from /data1
        console.log(response)
        const data = await response.json() //get json information from fetch
        console.log(data)

        //clear table
        table.querySelector("thead tr").innerHTML = ""//table headings
        table.querySelector("tbody").innerHTML = ""//table body

        //populate headers
        for (var i=0;i<2;i++){
            table.querySelector("thead tr").insertAdjacentHTML("beforeend", `<th>${data[0][i]}</th>`)
        }

        //populate rows
        for (var row of data){
            if (row[0] != "Name"){
                table.querySelector("tbody").insertAdjacentHTML("beforeend", `
                    <tr>
                        ${row.map(col => `<td>${ col }</td>`).join("")}
                    </tr>
                `)
            } 
        }

        //stop spinning refresh button
        root.querySelector(".table-refresh__button").classList.remove("table-refresh__button--refreshing")
        
    }

    

    //dynamically generate leaderboard table
    for (const root of document.querySelectorAll(".table-refresh[data-url]")){

        //create an object for table and "options" section, which contains the refresh button
        const table = document.createElement("table");
        const options = document.createElement("div");
        
        //add templates from css
        table.classList.add("table-refresh__table");
        options.classList.add("table-refresh__options");
        
        //create dynamic HTML
        table.innerHTML = `
            <thead>
                <tr></tr>
            </thead>
            <tbody>
                <tr>
                    <td>Loading</td>
                </tr>
            </tbody>

        `;

        //create dynamic HTML
        options.innerHTML = `
            <!-- <span class="table-refresh__label">Last Update: never</span> -->
            <button type="button" class="table-refresh__button">
                <i class="material-icons">refresh</i>
            </button>
        `;

        

        

        
        //show table and refresh button on page
        root.append(table, options);

        //upon refresh button press, refresh the table
        options.querySelector(".table-refresh__button").addEventListener("click", () => {
            updateTable(root);
        })

        


        

        
        //populate table
        updateTable(root);

    }

    //dynamically generate "name" form
    for (const root2 of document.querySelectorAll(".inputName[data-url]")){
        const form = document.createElement("div");

        form.classList.add("inputName");

        form.innerHTML = `
            <form action="/particle" method="POST" class="nameForm">
                <div>
                    <label for="name">Name:</label>
                    <input type="text" id="name" name="name" />
                </div>
                <button type="submit" class="nameButton">Submit</button>
            </form>
        `;

        root2.append(form);

        form.querySelector(".nameForm").addEventListener("submit", () => {
            updateGoogleSheet(root2);
        })
        

        
    }

    

}