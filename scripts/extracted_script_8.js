 -->
<!-- const modalOverlay = document.getElementById('modalOverlay'); -->
<!-- const modalCard = document.getElementById('modalCard'); -->
<!-- const closeModalCross = document.getElementById('closeModalCross'); -->
<!-- const closeModalBtn = document.getElementById('closeModalBtn'); -->
<!-- -->
<!-- // Function to reveal modal -->
<!-- function showModal() { -->
<!-- modalOverlay.classList.remove('hidden'); -->
<!-- // Small delay to ensure the browser registers the removal of 'hidden' for transition -->
<!-- setTimeout(() => { -->
<!-- modalOverlay.classList.remove('opacity-0'); -->
<!-- modalCard.classList.remove('scale-90'); -->
<!-- modalCard.classList.add('scale-100'); -->
<!-- }, 50); -->
<!-- } -->
<!-- -->
<!-- // Function to hide modal -->
<!-- function hideModal() { -->
<!-- modalOverlay.classList.add('opacity-0'); -->
<!-- modalCard.classList.remove('scale-100'); -->
<!-- modalCard.classList.add('scale-90'); -->
<!-- // Wait for the transition to finish before hiding display -->
<!-- setTimeout(() => { -->
<!-- modalOverlay.classList.add('hidden'); -->
<!-- }, 500); -->
<!-- } -->
<!-- -->
<!-- // AUTO TRIGGER: Fires when the page successfully finishes loading -->
<!-- window.addEventListener('load', () => { -->
<!-- // Optional: Add a slight artificial delay (e.g., 1000ms) for better UX impact -->
<!-- setTimeout(showModal, 1000); -->
<!-- }); -->
<!-- -->
<!-- // Event Listeners for closing the modal -->
<!-- closeModalCross.addEventListener('click', hideModal); -->
<!-- closeModalBtn.addEventListener('click', hideModal); -->
<!-- -->
<!-- // Closes the modal if user clicks on the backdrop outside the card -->
<!-- modalOverlay.addEventListener('click', (e) => { -->
<!-- if (e.target === modalOverlay) hideModal(); -->
<!-- }); -->
<!-- 