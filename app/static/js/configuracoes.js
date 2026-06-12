function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

function applyTheme(theme){

    document.body.classList.remove('dark');

    document.querySelectorAll('.theme-card')
    .forEach(card => card.classList.remove('active'));

    if(theme === 'dark'){
        document.body.classList.add('dark');
        document.getElementById('dark').classList.add('active');
    }
    else if(theme === 'light'){
        document.getElementById('light').classList.add('active');
    }
    else{

        document.getElementById('system').classList.add('active');

        if(window.matchMedia('(prefers-color-scheme: dark)').matches){
            document.body.classList.add('dark');
        }
    }
}

function setTheme(theme){
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

applyTheme(
    localStorage.getItem('theme') || 'system'
);
