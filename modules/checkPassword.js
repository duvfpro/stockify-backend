function checkBodyPassword(body, keys) {
    let isValid = true;
    const regexSpaces = /\s/; // Regex pour vérifier les espaces

    for (const field of keys) {
        // Vérifier si le champ est vide ou contient des espaces
        if (!body[field] || body[field] === '' || regexSpaces.test(body[field])) {
            isValid = false;
            break; // Arrêter la boucle dès qu'une condition n'est pas satisfaite
        }
    }

    return isValid;
}   


module.exports = { checkBodyPassword };


