var HttpService = {
    uploadFile: async function(url ,formData) {
        const response = await fetch(url, {
            method: 'PUT',
            body: formData
        });
        return response.json();
    }
};
