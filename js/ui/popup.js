const popupPanel = document.querySelector('.popup-panel');
const popupPanelBackground = document.querySelector('.popup-background');
const popupPanelCloseButton = document.getElementById('close-popup-button');
const popupContent = document.querySelector('.popup-content');
const popupHeader = document.querySelector('.popup-header');

popupPanelBackground.addEventListener('click', () => {
    popupPanel.classList.add('hidden');
});
popupPanelCloseButton.addEventListener('click', () => {
    popupPanel.classList.add('hidden');
});

export function showPopupPanel(heading, innerHTML) {
    popupPanel.classList.remove('hidden');
    popupHeader.querySelector('h3').innerText = heading;
    popupContent.innerHTML = innerHTML;
}

export function showPacketPopup(packet)
{
    if(!packet || !packet.headers) return;
    const wrapper = document.createElement("div");
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    let tr = document.createElement("tr");
    tr.innerHTML = `<th>Property</th><th>Value</th>`;
    tbody.appendChild(tr);
    tr = document.createElement("tr");
    tr.innerHTML = `<td>Data</td><td>${packet.data}</td>`;
    tbody.appendChild(tr);
    for(let key in packet.headers)
    {
        let value = packet.headers[key];
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${key}</td><td>${value}</td>`;
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    showPopupPanel("Packet Metadata", wrapper.innerHTML);
}