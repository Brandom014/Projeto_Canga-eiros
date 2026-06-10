function applyTheme(theme){

    // sempre limpa primeiro
    document.body.classList.remove("dark");

    // aplica escuro se for dark
    if(theme === "dark"){
        document.body.classList.add("dark");
    }

    // salva no navegador
    localStorage.setItem("theme", theme);
}

function setTheme(theme){
    applyTheme(theme);
}

// quando a página carregar, aplica o tema salvo
document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("theme") || "light";
    applyTheme(saved);
});

function setTheme(theme){

    localStorage.setItem("theme", theme);

    applyTheme(theme);
}

function applyTheme(theme){

    document.body.classList.remove("dark");

    if(theme === "dark"){
        document.body.classList.add("dark");
    }
}