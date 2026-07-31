// pages/personal.js — Personal Information
window.CVPages = window.CVPages || {};

window.CVPages.personal = {
  id: 'personal',
  title: 'Personal Information',
  icon: 'user',
  subtitle: 'Let\'s start with the basics. This appears at the top of your CV.',
  render(data) {
    const p = data.personal || {};
    return `
      <div class="photo-upload">
        <img class="photo-preview" id="photoPreview" src="${p.photo || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Ccircle cx=%2240%22 cy=%2240%22 r=%2238%22 fill=%22%23e6e9ef%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 fill=%22%238b92a0%22 font-size=%2224%22%3E%3C/text%3E%3C/svg%3E'}" alt="Profile">
        <div>
          <button class="btn btn-secondary" onclick="document.getElementById('photoInput').click()"><i class="fas fa-camera"></i> Upload Photo</button>
          <input type="file" id="photoInput" accept="image/*" hidden onchange="handlePhotoUpload(event)">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Full Name</label><input type="text" id="fullName" placeholder="Muhammad Ali" value="${escapeHTML(p.fullName)}"></div>
        <div class="form-group"><label>Professional Title</label><input type="text" id="professionalTitle" placeholder="Software Engineer" value="${escapeHTML(p.professionalTitle)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input type="email" id="email" placeholder="ali@example.com" value="${escapeHTML(p.email)}"></div>
        <div class="form-group"><label>Phone Number</label><input type="text" id="phone" placeholder="+92 300 1234567" value="${escapeHTML(p.phone)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>City / Country</label><input type="text" id="location" placeholder="Lahore, Pakistan" value="${escapeHTML(p.location)}"></div>
        <div class="form-group"><label>LinkedIn</label><input type="text" id="linkedin" placeholder="linkedin.com/in/ali" value="${escapeHTML(p.linkedin)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Personal Website</label><input type="text" id="website" placeholder="ali.dev" value="${escapeHTML(p.website)}"></div>
        <div class="form-group"><label>GitHub</label><input type="text" id="github" placeholder="github.com/ali" value="${escapeHTML(p.github)}"></div>
      </div>
    `;
  },
  afterRender(data) {
    const p = data.personal || {};
    if (p.photo) document.getElementById('photoPreview').src = p.photo;
  },
  collect() {
    return {
      fullName: val('fullName'),
      professionalTitle: val('professionalTitle'),
      email: val('email'),
      phone: val('phone'),
      location: val('location'),
      linkedin: val('linkedin'),
      website: val('website'),
      github: val('github'),
      photo: (document.getElementById('photoPreview') || {}).src || ''
    };
  }
};

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('photoPreview').src = e.target.result;
  };
  reader.readAsDataURL(file);
}
