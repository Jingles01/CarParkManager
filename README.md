# Vehicle Inventory Manager

A cross-platform mobile app for valet services, designed to replace inefficient paper-based tracking systems. Built with React Native and Firebase, it provides a real-time, multi-user solution for managing vehicle check-ins, check-outs, and parking lot visualization.

**Link to Video Demo:** [https://www.youtube.com/watch?v=5_5dNkJDp24](https://www.youtube.com/watch?v=5_5dNkJDp24)


## How It's Made:

**Tech used:** React Native, Firebase, Expo, TypeScript

This application was developed to solve the real-world problem of inefficient manual vehicle tracking in valet services. It uses a modern mobile stack, with **React Native** and **Expo** enabling a single TypeScript codebase to be deployed on both iOS and Android.

The entire backend is powered by **Firebase (BaaS)**, which handles user authentication, real-time data synchronization with **Firestore**, and secure data storage. The core feature is a real-time visual parking map, rendered using SVG, that allows valets to see spot availability at a glance and streamline the check-in process. The app implements strict, role-based access control for 'Admin' and 'Valet' users, enforced by Firestore Security Rules.

## Optimizations

* **Advanced Admin Tools:** Enhance the admin dashboard with features to edit user roles directly within the app and manage multiple parking lot layouts.
* **Automated Notifications:** Implement push notifications to alert staff when a customer's vehicle is due for pickup.
* **Analytics Dashboard:** Create a section for admins to view analytics, such as average parking duration, peak hours, and revenue tracking.
* **Payment Integration:** Integrate a payment gateway to handle parking fees directly within the check-out flow.

## Lessons Learned:

* **Leveraging Backend-as-a-Service (BaaS):** Using Firebase for the backend significantly accelerated development time. Its real-time capabilities were essential for the visual parking map and live vehicle lists, providing a seamless multi-user experience without managing complex server infrastructure.
* **Implementing Role-Based Access Control:** Designing and enforcing different permissions for 'Admin' and 'Valet' roles using Firestore Security Rules was a critical lesson in building secure, real-world applications.
* **Cross-Platform Development with React Native:** Building for both iOS and Android from a single TypeScript codebase highlighted the power and efficiency of modern mobile development frameworks.
* **The Power of Visual Data:** The real-time visual parking map proved to be a much more intuitive and efficient solution for valets than a simple list, reinforcing the importance of user-centric design in solving operational problems.
