# TestEasyCallJs

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.7.
---

## **Getting Started with the Library**

### **Test Setup**

For testing purposes, we assume that users with IDs `2222` and `3333` will be contacted by the user with ID `1111`. *(In a real application, you would use actual user IDs from your database or authentication system.)*

Since we are running locally, all devices must be connected to the same network, and the Angular project should be started with the following command:

```bash
ng serve --host 0.0.0.0 --port 4200 --ssl true
```

The main user initiating the call connects via:

```plaintext
https://192.168.1.14:4200/home?userId=1111
```

The users joining the call connect via:

```plaintext
https://192.168.1.14:4200/home?userId=2222
https://192.168.1.14:4200/home?userId=3333
```

Once users `2222` and `3333` access the application, and the main user (`1111`) initiates the call, a **"Take Call"** button will appear for `2222` and `3333`. Clicking this button allows them to answer the call.

---

### **No Expertise Required**

- **No Firebase or WebRTC expertise needed**: This library simplifies the process, allowing you to implement multipoint video calls in your application without prior knowledge of Firebase or WebRTC.
- If you prefer not to use Firebase, you can create your own implementation of the `CallProcess` interface using your custom signaling server.

---

### **Simple and Free**

This library makes it **easy** and **free** to integrate multipoint video calls, even for developers new to WebRTC.

---

### **Try It Out and Share Your Feedback**

Feel free to integrate this library into other contexts or frameworks. Share your feedback and experiences with us—your input helps us improve and explore new possibilities! 🚀

---
