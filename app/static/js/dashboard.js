function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

const params = new URLSearchParams(window.location.search);

if(params.get("erro") === "acesso_negado"){
    const toast = document.getElementById("toast");

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);

    window.history.replaceState({}, document.title, "/dashboard");
}