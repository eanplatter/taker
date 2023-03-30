import { faker } from '@faker-js/faker'
import {
	Type,
	InterfaceDeclaration as TsMorphInterfaceDeclaration,
	Project,
	EnumDeclaration,
} from 'ts-morph'

function generateValueFromType(type: Type, project: Project): any {
	const basicTypes: { [key: string]: any } = {
		string: () => faker.random.word(),
		number: () => faker.datatype.number(),
		boolean: () => faker.datatype.boolean(),
	}

	const typeName = type.getText()
	if (basicTypes[typeName]) {
		return basicTypes[typeName]()
	} else {
		if (type.isEnum()) {
			const enumDeclaration = type.getSymbol()?.getDeclarations()?.[0] as
				| EnumDeclaration
				| undefined
			if (enumDeclaration) {
				const enumMembers = enumDeclaration.getMembers()
				const randomIndex = faker.datatype.number({
					min: 0,
					max: enumMembers.length - 1,
				})
				return enumMembers[randomIndex].getValue()
			}
		} else if (type.isClassOrInterface()) {
			const interfaceDeclaration = type.getSymbol()?.getDeclarations()?.[0] as
				| TsMorphInterfaceDeclaration
				| undefined
			if (interfaceDeclaration) {
				return generateMockData(interfaceDeclaration, project)
			}
		}
	}

	return undefined
}

function generateMockData(
	interfaceDeclaration: TsMorphInterfaceDeclaration,
	project: Project,
): any {
	const mockData: any = {}
	const properties = interfaceDeclaration.getProperties()
	const typeChecker = project.getTypeChecker()

	properties.forEach((property) => {
		const propertyName = property.getName()
		const propertyType = typeChecker.getTypeAtLocation(property)

		mockData[propertyName] = generateValueFromType(propertyType, project)
	})

	return mockData
}

async function main() {
	const interfaceName = process.argv[2]

	if (!interfaceName) {
		console.error('Please provide an interface name')
		process.exit(1)
	}

	const project = new Project({
		tsConfigFilePath: process.cwd() + '/tsconfig.json',
	})

	const sourceFiles = project.getSourceFiles()
	let tsMorphInterfaceDeclaration: TsMorphInterfaceDeclaration | undefined

	for (const sourceFile of sourceFiles) {
		tsMorphInterfaceDeclaration = sourceFile.getInterface(interfaceName)
		if (tsMorphInterfaceDeclaration) {
			break
		}
	}
	if (!tsMorphInterfaceDeclaration) {
		console.error(`Interface "${interfaceName}" not found`)
		process.exit(1)
	}

	const mockData = generateMockData(tsMorphInterfaceDeclaration, project)
	console.log(JSON.stringify(mockData, null, 2))
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
