import {Doughnut} from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, plugins } from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(ArcElement,Tooltip,Legend,ChartDataLabels);

const PieChartComponent2=({data})=>{
    const chart={
        labels:["teachers"],
        datasets:[
            {
                label:'Number of Teachers',
                data:[data.teachers_count],
                backgroundColor:[
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
                borderWidth:1,
            }
            

        ]
    }
    const options={
        plugins:{
            legend:{
                position:'top',
            },
            datalabels:{
                color:'#fff',
                formatter:(value)=>`${value} teachers`,
                font:{
                    weight:'bold',
                    size:20,
                }
            }
        }
    }

    return(
        <div>
            <h2>
                Teachers distirbution by class
            </h2>
            <Doughnut data={chart} options={options}></Doughnut>
        </div>
    )
}
export default PieChartComponent2;