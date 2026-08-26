function toggleSidebar() {
    document.getElementById("sidebar")?.classList.toggle("collapsed");
}

const profile = document.querySelector(".user-profile");
const profileMenu = document.getElementById("profileMenu");
profile?.addEventListener("click", (event) => {
    event.stopPropagation();
    profileMenu?.classList.toggle("visible");
});
profileMenu?.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", () => profileMenu?.classList.remove("visible"));

const params = new URLSearchParams(window.location.search);

if(params.get("erro") === "acesso_negado"){
    const toast = document.getElementById("toast");

    toast?.classList.add("show");

    setTimeout(() => {
        toast?.classList.remove("show");
    }, 4000);

    window.history.replaceState({}, document.title, "/dashboard");
}