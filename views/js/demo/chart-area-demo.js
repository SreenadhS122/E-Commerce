  $.ajax({
  url : '/chart',
  type : 'post',
  data : {
    value : 'weekly'
  },
  success : (res) => {
    chart(res)
  }
});
  $("#filter1").submit(function(e) {
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: "/chart",
      data: {
        value: 'weekly',
      },
      success: function(result) {
        chart(result)
      },
      error: function(result) {
        alert('error');
      }
    });
});
$("#filter2").submit(function(e) {
  e.preventDefault();
  $.ajax({
    type: "POST",
    url: "/chart",
    data: {
      value: 'monthly',
    },
    success: function(result) {
      chart(result)
    },
    error: function(result) {
      alert('error');
    }
  });
});
$("#filter3").submit(function(e) {
  e.preventDefault();
  $.ajax({
    type: "POST",
    url: "/chart",
    data: {
      value: 'yearly',
    },
    success: function(result) {
      chart(result)
    },
    error: function(result) {
      alert('error');
    }
  });
});
$("#filter4").submit(function(e) {
  e.preventDefault();
  $.ajax({
    type: "POST",
    url: "/chart",
    data: {
      value: 'daily',
    },
    success: function(result) {
      chart(result)
    },
    error: function(result) {
      alert('error');
    }
  });
});
$("#filter5").submit(function(e) {
  e.preventDefault();
  $.ajax({
    type: "POST",
    url: "/chart",
    data: {
      value: 'dateFilter',
      startDate : $('#startDate').val(),
      endDate : $("#endDate").val()
    },
    success: function(result) {
      chart(result)
    },
    error: function(result) {
      alert('error');
    }
  });
});

async function chart(data) {
  new Chart(
    document.getElementById('myAreaChart'),
    {
      
      type: 'line',
      data: {
        labels : data.map(row => row.day),
        datasets: [
          {
            label: 'Sales Report',
            data: data.map(row => row.amount),
            borderColor : '#4e73df',
            fill : false
          },
          
        ],
        options : {
          scales : {
            x : {
              type : 'time',
              time : {
                unit : 'day'
              },
              max : 500000
            },
            y : [{
              ticks: {
                beginAtZero: true
            }
            }]
          }    
        }
      }
    }
  );
};
chart();
