function combineDocuments(docs) {
    // console.log(docs.map((doc) => doc.pageContent).join('\n\n'));
    return docs.map((doc) => doc.pageContent).join('\n\n');
}

export { combineDocuments }